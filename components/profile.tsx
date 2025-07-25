export const DefaultProfileIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <div className={`${className} bg-gray-200 rounded-full flex items-center justify-center`}>
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
);