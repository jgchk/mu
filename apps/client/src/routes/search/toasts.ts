import LinkToast from '$lib/components/LinkToast.svelte'
import type { ToastStore } from '$lib/toast/toast'

export const showSuccessToast = (toast: ToastStore, title: string | undefined) =>
  toast.success(LinkToast, {
    props: {
      message: [
        'Added ',
        ...(title ? [`"${title}" `] : []),
        'to ',
        { text: 'downloads', href: '/downloads' },
        '!',
      ],
    },
  })
