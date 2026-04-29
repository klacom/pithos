"use client"

import { Button } from "../ui/button"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"
import InputTextField from "@/components/technical-components/InputTextField"
import SortBy from "./SortBy"
import FilterBy from "./FilterBy"
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { Header } from "@tanstack/react-table"
import { JSX } from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChangeEvent, useEffect } from "react"
import { formatEntity } from "@/lib/functions"

export function DataTable<T>({
    entity,
    columns,
    data,
    total,
    page,
    setPage,
    q,
    setQ,
    debouncedQ,
    setDebouncedQ,
    sort,
    setSort,
    order,
    setOrder,
    loading,
    filter,
    setFilter,
    doesSearchableColumnsExist
}: any) {

    const [filterOptions, setFilterOptions] = useState<
        Record<string, { value: string }[]>
    >({});

    const columnDefs: ColumnDef<T>[] = columns.map((col: any) => ({
        accessorKey: col.key,
        header: col.label,
        cell: ({ row }: any) =>
            col.render
                ? col.render(row.getValue(col.key), row.original)
                : row.getValue(col.key),
        enableSorting: col.sortable,
        enableColumnFilter: col.filterable
    }))

    const table = useReactTable({
        data,
        columns: columnDefs,
        getCoreRowModel: getCoreRowModel(),
    })

    const totalPages = Math.ceil(total / 9)

    const rows = table.getRowModel()?.rows ?? []
    // console.log("Rows: ", rows);

    const searchOnChange = () => {
        setDebouncedQ(q)
        setPage(1)
    }

    const fetchOptions = async (header: Header<T, unknown>) => {
        const key = header.column.id;

        const res = await fetch("/api/fetch-distinct-values", {
            method: "POST",
            body: JSON.stringify({ column_name: key, table_name: entity })
        });

        const json = await res.json();

        if (!res.ok) {
            console.log("Error:", json.error);
            return [];
        }

        return json.data;
    }

    // Debounce for search value
    useEffect(() => {
        // const debouncedSearch = debounce(searchOnChange, 1000);
        const handler = setTimeout(() => {
            searchOnChange();
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [q])

    useEffect(() => {
        const loadOptions = async () => {
            const newOptions: Record<string, { value: string }[]> = {};

            for (const headerGroup of table.getHeaderGroups()) {
                for (const header of headerGroup.headers) {
                    if (header.column.columnDef.enableColumnFilter) {
                        const key = header.column.id as string;
                        newOptions[key] = await fetchOptions(header);
                    }
                }
            }

            console.log("New Options: ", newOptions);
            setFilterOptions(newOptions);
        };

        loadOptions();
    }, [columns]);

    const sortFunction = (header: Header<T, unknown>) => {
        if (!header.column.columnDef.enableSorting) return;

        const key = header.id;

        const newOrder =
            sort === key && order === "asc"
                ? "desc"
                : "asc";

        setSort(key);
        setOrder(newOrder);
    }

    const filterFunction = (header: Header<T, unknown>) => {

    }

    const getPageNumbers = () => {
        const pages: (number | "...")[] = [];

        if (totalPages <= 5) {
            // If few pages, show all
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (page > 3) {
                pages.push("...");
            }

            // Middle pages
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (page < totalPages - 2) {
                pages.push("...");
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex flex-col gap-4 h-full w-full justify-between">

            <div className="flex flex-col gap-4 w-full">

                {/*  Search  */}
                <div className="flex flex-row gap-2">
                    <input
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value)
                        }}
                        placeholder={`Search ${formatEntity(entity)}...`}
                        className={`border-muted outline-none focus:border-foreground focus:ring-foreground w-full hover:border hover:border-foreground bg-primary-foreground px-5 rounded-md ${doesSearchableColumnsExist ? 'block' : 'hidden'}`}
                    />
                    <Button
                        className="h-full"
                        variant="outline"
                        onClick={() => {
                            setFilter({});
                        }}
                    >
                        Clear Filters
                    </Button>
                    {/* <SortBy sortOptions={[""]} />
                    <FilterBy filterOptions={[""]} /> */}
                </div>

                {/* Table wrapper */}
                <div className="w-full border border-muted rounded-lg overflow-y-hidden overflow-x-auto p-4">

                    <table className="min-w-full border-collapse *:*:*:border *:*:*:border-muted w-full">

                        <thead className="">
                            {table.getHeaderGroups().map((hg) => (
                                <tr key={hg.id} className="bg-primary-foreground">
                                    {hg.headers.map((header) => {
                                        return (
                                            <th
                                                key={header.id}
                                                onClick={() => (header.column.columnDef.enableColumnFilter ? filterFunction(header) : sortFunction(header))}
                                                className={`${header.column.columnDef.enableSorting || header.column.columnDef.enableColumnFilter
                                                    ? "cursor-pointer hover:bg-secondary active:bg-primary-foreground"
                                                    : "cursor-default opacity-50"
                                                    }`}
                                            >
                                                {
                                                    header.column.columnDef.enableColumnFilter
                                                        // Filter Div 
                                                        ? <select
                                                            defaultValue=""
                                                            className="border-0 outline-none focus:bg-secondary focus:ring-0 h-full w-full m-0 bg-primary-foreground hover:bg-secondary active:bg-primary-foreground p-4"
                                                            onChange={(e) =>
                                                                setFilter((prev: any) => ({
                                                                    ...prev,
                                                                    [header.column.id]: e.target.value
                                                                }))
                                                            }
                                                        >
                                                            {/* Parang Placeholder - initial value na makikita ng user */}
                                                            <option value="">
                                                                All {flexRender(header.column.columnDef.header, header.getContext())}
                                                            </option>

                                                            {/* Options */}
                                                            {
                                                                (filterOptions[header.column.id as string] || []).map((opt) => (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {opt.value}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        // Sorting Div
                                                        : <div className="flex flex-row gap-2 justify-center items-center p-4">
                                                            {
                                                                flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )
                                                            }
                                                            {header.column.columnDef.enableSorting ? (order === "asc" ? <IoIosArrowUp /> : <IoIosArrowDown />) : ""}
                                                        </div>
                                                }
                                            </th>
                                        )
                                    })}
                                </tr>
                            ))}
                        </thead>

                        <tbody className="*:*:p-4">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-10 text-muted-foreground">
                                        Loading...
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-10 text-muted-foreground">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                </div>

            </div>


            {/* Pagination */}


            <div className="flex items-center justify-between">

                {/* Page Number */}
                <p className="text-sm text-muted-foreground">
                    Page <span className="font-medium text-foreground">
                        {page}
                    </span> of <span className="font-medium text-foreground">
                        {totalPages || 1}
                    </span>
                </p>

                {/* Page Buttons */}
                <div className="flex items-center gap-2">

                    {/* Previous */}
                    <Button variant="outline" size="sm" className="h-8 px-2" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous Page</span>
                    </Button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((p, i) =>
                        p === "..." ? (
                            <span key={i} className="text-muted-foreground px-2">...</span>
                        ) : (
                            <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className={`h-8 w-8 p-0 ${p === page ? "bg-accent text-accent-foreground" : ""}`}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </Button>
                        )
                    )}

                    {/* Next */}
                    <Button variant="outline" size="sm" className="h-8 px-2" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next Page</span>
                    </Button>
                </div>

            </div>

        </div>
    )
}