import type { CustomInstructions } from '@context/user';
import { supabase } from '@utils/supabase';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from 'react-query';

const deleteUser = async (userId: string) => {
	const { data } = await supabase
		.from('profile')
		.delete()
		.eq('id', userId)
		.select();

	return data;
};

const updateUserEmail = async ({
	email,
	userId,
}: {
	email: string;
	userId: string;
}) => {
	const { data } = await supabase
		.from('profile')
		.update({ email })
		.eq('id', userId)
		.select();

	return data;
};

const updateUserFirstTime = async ({ userId }: { userId: string }) => {
	const { data } = await supabase
		.from('profile')
		.update({ has_seen_tour: true })
		.eq('id', userId)
		.select();

	return data;
};

export const useUpdateUserFirstTime = (options?: {
	onSuccessCb: (data: any) => void;
}) => {
	return useMutation(updateUserFirstTime, {
		mutationKey: 'update-user-first-time',
		onSuccess: data => {
			options?.onSuccessCb(data);
		},
	});
};

export const useUpdateUserEmail = ({
	onSuccessCb,
}: {
	onSuccessCb: (data: any) => void;
}) => {
	return useMutation(updateUserEmail, {
		mutationKey: 'update-user',
		onSuccess: data => {
			onSuccessCb(data);
			toast.success('User Email changed successfully!');
		},
		onError: error => {
			console.log({ error });
			//TODO: need to show a more clearer message
			toast.error('There is something wrong. Please try again.');
		},
	});
};

export const useDeleteUser = ({ onSuccessCb }: { onSuccessCb: () => void }) => {
	return useMutation(deleteUser, {
		mutationKey: 'delete-user',
		onSuccess: () => {
			onSuccessCb();
			toast.success('User deleted successfully!');
		},
		onError: error => {
			console.log({ error });
			//TODO: need to show a more clearer message
			toast.error('There is something wrong. Please try again.');
		},
	});
};

const updateCustomInstructions = async ({
	userId,
	customInstructions,
}: {
	userId: string;
	customInstructions: CustomInstructions | null;
}) => {
	const { data, error } = await supabase
		.from('profile')
		.update({ custom_instructions: customInstructions })
		.eq('id', userId)
		.select();

	if (error) {
		throw error;
	}

	return data;
};

export const useUpdateCustomInstructions = () => {
	const queryClient = useQueryClient();
	return useMutation(updateCustomInstructions, {
		mutationKey: 'update-custom-instructions',
		onMutate: data => {
			//
		},
		onSuccess: data => {
			toast.success('Custom instructions updated!');
			queryClient.invalidateQueries('fetch-user-profile');
		},
		onError: error => {
			console.log({ error });

			toast.error('Failed to update custom instructions. Please try again.');
		},
	});
};

const updateEditorLanguage = async ({
	userId,
	editorLanguage,
}: {
	userId: string;
	editorLanguage: string;
}) => {
	const { data, error } = await supabase
		.from('profile')
		.update({ editor_language: editorLanguage })
		.eq('id', userId)
		.select();

	if (error) {
		throw error;
	}

	return data;
};

export const useUpdateEditorLanguage = () => {
	const queryClient = useQueryClient();
	return useMutation(updateEditorLanguage, {
		mutationKey: 'update-editor-instructions',
		onMutate: data => {
			//
		},
		onSuccess: data => {
			toast.success('Editor language updated!');
			queryClient.invalidateQueries('fetch-user-profile');
		},
		onError: error => {
			console.log({ error });

			toast.error('Failed to update editor language');
		},
	});
};

export const getUserStorageSize = async (userId: string) => {
	const ceil = num => Math.ceil(num);
	const { data: files, error } = await supabase.storage
		.from('user-uploads')
		.list(userId);

	if (error) {
		return;
	}
	let totalSize = 0;

	// Step 2: Get the size of each file and sum them up
	for (const file of files) {
		totalSize += file.metadata.size;
	}
	// Step 3: Total size in bytes
	return ceil(totalSize / 1000000); // convert to MB
};
