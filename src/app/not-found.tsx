import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white dark:bg-gray-950">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800">
        <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">?</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Not Found</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3 mt-2">
        <Link
          href="/dashboard/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/login/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}
