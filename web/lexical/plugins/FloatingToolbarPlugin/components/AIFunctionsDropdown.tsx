import ToolbarButton from '@lexical/plugins/FloatingToolbarPlugin/components/FloatingToolbarButton';
import { useTour } from '@reactour/tour';
import { $getSelection, $isRangeSelection } from 'lexical';
import {
	HelpCircle,
	List,
	ListTree,
	Maximize2,
	Minimize2,
	Pencil,
	Radar,
	Scissors,
	Search,
	Wand2,
	Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import useAIAssistantStore from '@context/aiAssistant.store';
import useLexicalEditorStore from '@context/lexicalEditor.store';
import { useUser } from '@context/user';
import useAIDetector from '@hooks/api/isaac/useAIDetector';
import useFindTextSources from '@hooks/api/isaac/useFindTextSources';
import useManipulationText from '@hooks/api/isaac/useManipulateText';
import { $createAIOutputNode } from '@lexical/nodes/AIOutputNode';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLocalStorage } from '@mantine/hooks';
import {
	manipulateTextMap,
	ManipulateTextMethods,
} from '@utils/manipulateTextMap';
import { useCompletion } from 'ai/react';
import { AIModelLocalStorageKey } from 'data/aiModels.data';
import { Sparkles } from 'lucide-react';

const AIFunctionsDropdown = () => {
	const [editor] = useLexicalComposerContext();
	const { user } = useUser();
	const language = user?.editor_language;
	const setFloatingInputActive = useLexicalEditorStore(
		s => s.setFloatingInputActive,
	);

	const [selectedText, setSelectedText] = useState<string>();
	const { isOpen: tutorialMode, setCurrentStep } = useTour();

	const handleOnOpen = () => {
		editor.update(() => {
			const selection = $getSelection();
			const text = selection.getTextContent();
			setSelectedText(text);
		});

		if (tutorialMode) {
			setTimeout(() => setCurrentStep(p => p + 1), 500);
		}
	};
	const { manipulateText } = useManipulationText();
	const { findSources } = useFindTextSources();
	const { sendToAIDetector } = useAIDetector();
	const { setAITextOutput, setCachedSelection, setOpen, setAIOperation } =
		useAIAssistantStore(state => state.actions);

	const [method, setMethod] = useState<ManipulateTextMethods>(null);
	const [customInstructions, setCustomInstructions] = useState<string>(null);
	console.log('customInstructions', customInstructions);

	// Update the method when a dropdown menu item is clicked
	const handleDropdownClick = (selectedMethod: ManipulateTextMethods) => {
		setMethod(selectedMethod);
	};

	const tooLong = (selectedText?.length || 0) > 1000;

	const [llmModel] = useLocalStorage({ key: AIModelLocalStorageKey });

	const insertAIOutputComponent = useCallback(() => {
		editor.update(() => {
			const selection = $getSelection();

			if (!$isRangeSelection(selection)) {
				return;
			}

			setCachedSelection(selection.clone());
			const aiOutputNode = $createAIOutputNode('text');
			const focusedNode = selection.focus.getNode();
			focusedNode.insertAfter(aiOutputNode, true);
			setOpen(true);
		});
	}, [editor]);

	const {
		completion,
		complete,
		input,
		stop,
		isLoading,
		handleInputChange,
		handleSubmit,
	} = useCompletion({
		api: method ? `${manipulateTextMap[method].endpoint}` : '/api/explain',
		body: {
			llmModel: `${llmModel || 'gpt-3.5-turbo'}`,
			userId: user?.id,
			editorLanguage: language,
		},
		onResponse: () => {
			insertAIOutputComponent();
		},
	});

	useEffect(() => {
		if (method === null) {
			return;
		}

		complete(
			manipulateTextMap[method]?.promptBuilder({
				selection: selectedText,
				editorLanguage: language,
			}),
		);
	}, [method]);

	setAITextOutput(completion);

	return (
		<DropdownMenu
			onOpenChange={handleOnOpen}
			{...(!tutorialMode
				? { transition: 'scale-y', transitionDuration: 300 }
				: null)}
		>
			<DropdownMenuTrigger>
				<ToolbarButton>
					<Sparkles
						size={16}
						strokeWidth={1.6}
						className="mr-1 h-4 w-4 text-[#F95730]/[0.7]"
					/>
					<span className="text-sm font-semibold pt-0.5 text-[#F95730]/[0.7]">
						Ask Isaac
					</span>
				</ToolbarButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				id="ai-assistant-menu-dropdown"
				align="start"
				className="DropdownMenuContent"
			>
				<DropdownMenuLabel>Manipulate Text</DropdownMenuLabel>
				{editor.isEditable() && (
					<>
						<DropdownMenuItem
							onClick={() =>
								manipulateText(selectedText, ManipulateTextMethods.SUMMARIZE)
							}
							aria-label="Summarize"
						>
							<Scissors size={16} className="mr-2 h-4 w-4" />
							<span>Summarize </span>
						</DropdownMenuItem>
						<DropdownMenuItem
							id={'manipulate-text'}
							onClick={() =>
								manipulateText(selectedText, ManipulateTextMethods.PARAPHRASE)
							}
							aria-label="manipulate-text"
							disabled={tooLong}
						>
							<Wand2 size={16} className="mr-2 h-4 w-4" />
							<span>Paraphrase </span>
						</DropdownMenuItem>
						<DropdownMenuItem
							id={'manipulate-text'}
							onClick={() =>
								manipulateText(selectedText, ManipulateTextMethods.EXPAND)
							}
							aria-label="manipulate-text"
							disabled={tooLong}
						>
							<Maximize2 size={16} className="mr-2 h-4 w-4" />
							Expand
						</DropdownMenuItem>
						<DropdownMenuItem
							id={'manipulate-text'}
							onClick={() =>
								manipulateText(selectedText, ManipulateTextMethods.IMPROVE)
							}
							aria-label="manipulate-text"
							disabled={tooLong}
						>
							<Zap size={16} className="mr-2 h-4 w-4" />
							Improve
						</DropdownMenuItem>
						<DropdownMenuItem
							id={'manipulate-text'}
							onClick={() =>
								manipulateText(selectedText, ManipulateTextMethods.SHORTEN)
							}
							aria-label="manipulate-text"
							disabled={tooLong}
						>
							<Minimize2 size={16} className="mr-2 h-4 w-4" />
							Shorten
						</DropdownMenuItem>

						<DropdownMenuItem
							onClick={() =>
								manipulateText(
									selectedText,
									ManipulateTextMethods.BULLET_TO_TEXT,
								)
							}
							aria-label="Bullets to text"
						>
							<ListTree size={16} className="mr-2 h-4 w-4" />
							Bullets to text
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								manipulateText(
									selectedText,
									ManipulateTextMethods.TEXT_TO_BULLET,
								)
							}
							aria-label="Bullets to text"
						>
							<List size={16} className="mr-2 h-4 w-4" />
							Text to bullets
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								setFloatingInputActive({
									documentId: '',
									onSubmit: text => {
										manipulateText(
											selectedText,
											ManipulateTextMethods.CUSTOM,
											text,
										);
									},
									placeholder: 'Write a custom prompt',
								})
							}
							aria-label="custom-prompt"
						>
							<Pencil size={16} className="mr-2 h-4 w-4" />
							Custom prompt
						</DropdownMenuItem>

						<DropdownMenuLabel>Utilities</DropdownMenuLabel>

						<DropdownMenuItem
							onClick={() => sendToAIDetector(selectedText)}
							aria-label="ai-detector"
							disabled={tooLong}
						>
							<Radar size={16} className="mr-2 h-4 w-4" />
							AI Detector
						</DropdownMenuItem>

						<DropdownMenuItem
							onClick={() => findSources(selectedText)}
							aria-label="find-sources"
							disabled={tooLong}
						>
							<Search size={16} className="mr-2 h-4 w-4" />
							Find sources
						</DropdownMenuItem>

						<DropdownMenuItem
							id={'manipulate-text'}
							onClick={() => handleDropdownClick(ManipulateTextMethods.EXPLAIN)}
							aria-label="manipulate-text"
							disabled={tooLong}
						>
							<HelpCircle size={16} className="mr-2 h-4 w-4" />
							Explain
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default AIFunctionsDropdown;
