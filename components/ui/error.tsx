export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
      {message}
    </div>
  );
}