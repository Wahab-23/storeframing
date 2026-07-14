"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  /** Placeholder text inside the input */
  placeholder?: string;
  /** Callback fired when the user submits the search */
  onSearch?: (query: string) => void;
  /** Optional className override for the outer wrapper */
  className?: string;
}

export function SearchBar({
  placeholder = "Search for products, brands and more...",
  onSearch,
  className = "",
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = (formData.get("q") as string)?.trim();
    if (query && onSearch) {
      onSearch(query);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center w-full ${className}`}
    >
      <input
        type="text"
        name="q"
        placeholder={placeholder}
        autoComplete="off"
        className="w-full h-10 pl-4 pr-12 rounded-full bg-matt-black-200 border border-matt-black-300/40 text-white-chalk-100 text-sm placeholder:text-matt-black-400 focus:outline-none focus:border-sunflower-100/50 focus:ring-1 focus:ring-sunflower-100/20 transition-all duration-200"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-sunflower-100 hover:bg-sunflower-200 text-matt-black-100 transition-colors duration-200"
      >
        <Search className="w-4 h-4 stroke-[2.5]" />
      </button>
    </form>
  );
}
