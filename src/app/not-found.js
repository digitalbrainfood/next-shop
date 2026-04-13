import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center max-w-md">
                <p className="text-7xl font-bold text-blue-600 mb-4">404</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h2>
                <p className="text-gray-500 mb-8">
                    The page you are looking for does not exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
