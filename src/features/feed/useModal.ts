import { useSearchParams } from 'react-router-dom'

export function useModal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const current = searchParams.get('modal')
  const open = (name: string) => setSearchParams({ modal: name })
  const close = () => setSearchParams({})
  return { current, open, close }
}
