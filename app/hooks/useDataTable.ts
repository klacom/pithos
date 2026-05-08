import { useEffect, useState } from "react"

export function useDataTable(
    entity: string,
    options: {
        searchableColumns?: string[]
        baseFilters?: Record<string, string | number | boolean>
        enabled?: boolean
        select?: string
        limit?: number
    }
) {
    const [data, setData] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(options.limit || 10)
    const [q, setQ] = useState("")
    const [debouncedQ, setDebouncedQ] = useState("");
    const [sort, setSort] = useState("")
    const [order, setOrder] = useState<"asc" | "desc">("asc")
    const [filter, setFilter] = useState<Record<string, string>>({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const doesSearchableColumnsExist = options.searchableColumns ? true : false
    const baseFiltersKey = JSON.stringify(options.baseFilters);

    const refresh = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        if (!options.enabled) return;

        const fetchData = async () => {

            try {

                // Search Params
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                    q: debouncedQ,
                    sort,
                    order,
                    select: options.select || "*"
                })

                // Append each searchable columns
                if (options.searchableColumns) {
                    options.searchableColumns.forEach(col => {
                        params.append("search", col);
                    });
                }

                // Append each base filter - different from normal filter
                if (options.baseFilters) {
                    Object.entries(options.baseFilters).forEach(([key, value]) => {
                        params.append(`base[${key}]`, String(value));
                    });
                }

                // Append each filter
                Object.entries(filter).forEach(([column, value]) => {
                    if (value) {
                        params.append(`filter[${column}]`, value);
                    }
                });

                const apiLink = `/api/${entity}?${params}`;
                console.log("Fetch Api Link: ", apiLink);
                const res = await fetch(apiLink, {
                    method: "GET"
                })

                const json = await res.json()

                // if (json && q) setPage(1) 

                setData(json.data)
                setTotal(json.total)
            } catch (error) {
                console.log("API-[entity] error: ", error);
            }

        }

        fetchData()
    }, [entity, page, debouncedQ, sort, order, filter, refreshTrigger, baseFiltersKey, options.enabled])

    useEffect(() => {
        setPage(1);
    }, [filter]);

    return {
        entity,
        data,
        total,
        page,
        setPage,
        limit,
        setLimit,
        q,
        setQ,
        debouncedQ,
        setDebouncedQ,
        sort,
        setSort,
        order,
        setOrder,
        filter,
        setFilter,
        refresh,
        doesSearchableColumnsExist,
        baseFiltersKey
    }
}