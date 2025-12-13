import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClientMultiSelect, type ClientMultiSelectOption } from './client-multi-select'

function Harness({ clients }: { clients: ClientMultiSelectOption[] }) {
  const [selected, setSelected] = useState<string[]>([])
  return <ClientMultiSelect clients={clients} selectedIds={selected} onChange={setSelected} />
}

describe('ClientMultiSelect', () => {
  const clients: ClientMultiSelectOption[] = [
    { id: 'a', name: 'Alice' },
    { id: 'b', name: 'Bob' },
    { id: 'c', name: 'Charlie' },
  ]

  it('filters by search and supports multi-select', () => {
    render(<Harness clients={clients} />)

    fireEvent.click(screen.getByRole('button', { name: /select clients/i }))

    fireEvent.change(screen.getByLabelText(/search clients/i), { target: { value: 'bo' } })

    expect(screen.getByText('Bob')).toBeTruthy()
    expect(screen.queryByText('Alice')).toBeNull()
    expect(screen.queryByText('Charlie')).toBeNull()

    fireEvent.click(screen.getByText('Bob'))

    expect(screen.getByRole('button', { name: /1 selected/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))

    expect(screen.getByRole('button', { name: /select clients/i })).toBeTruthy()
  })
})

