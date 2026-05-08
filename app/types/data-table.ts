export type ColumnConfig<T> = {
    key: keyof T
    label: string
    sortable?: boolean
    searchable?: boolean
    render?: (value: any, row: T) => React.ReactNode
}

export type DataTableConfig<T> = {
    entity: string // "users", "orders", etc.
    columns: ColumnConfig<T>[]
}