'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconUpload } from '@tabler/icons-react';

import TransactionTable from '@/components/transactions/table';
import TransactionUploadDialog from '@/components/transactions/upload-dialog';

import { getAllTransactions } from '@/lib/api/transactions';

// Pagination controls component
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  // Show limited number of page buttons
  const getPageNumbers = () => {
    const maxButtonsToShow = 5; // Adjust this number as needed
    
    if (totalPages <= maxButtonsToShow) {
      // If we have fewer pages than the max, show all
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);
    
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    if (!shouldShowLeftDots && shouldShowRightDots) {
      // Show first few pages
      const leftRange = Array.from({ length: maxButtonsToShow - 1 }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }
    
    if (shouldShowLeftDots && !shouldShowRightDots) {
      // Show last few pages
      const rightRange = Array.from(
        { length: maxButtonsToShow - 1 }, 
        (_, i) => totalPages - (maxButtonsToShow - 2) + i
      );
      return [1, '...', ...rightRange];
    }
    
    if (shouldShowLeftDots && shouldShowRightDots) {
      // Show pages around current page with dots on both sides
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }
  };
  
  const pages = getPageNumbers();
  
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </Button>
      
      {pages.map((pageNum, i) => (
        pageNum === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2">...</span>
        ) : (
          <Button
            key={pageNum}
            variant={pageNum === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "min-w-[32px]",
              pageNum === currentPage && "bg-primary text-primary-foreground"
            )}
          >
            {pageNum}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUncategorizedOnly, setShowUncategorizedOnly] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    isPreviousData
  } = useQuery({
    queryKey: ['transactions', { page, pageSize, searchTerm, showUncategorizedOnly, selectedAccounts }],
    queryFn: () => getAllTransactions(
      page, 
      pageSize, 
      null, 
      searchTerm, 
      showUncategorizedOnly,
      selectedAccounts.length > 0 ? selectedAccounts : null
    ),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    keepPreviousData: true,
    placeholderData: (previousData) => previousData,
  });

  const handleSearchChange = (value, accounts) => {
    // Only do something if the search term or accounts actually changed
    if (value !== searchTerm || JSON.stringify(accounts) !== JSON.stringify(selectedAccounts)) {
      setSearchTerm(value);
      setSelectedAccounts(accounts);
      // Reset to page 1 when search or filters change
      if (page !== 1) {
        setPage(1);
      }
    }
  };

  const handleUncategorizedChange = (value) => {
    setShowUncategorizedOnly(value);
    // Reset to page 1 when filter changes
    if (page !== 1) {
      setPage(1);
    }
    // Invalidate and refetch the query
    queryClient.invalidateQueries(['transactions']);
  };

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading transactions: {error.message}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={() => setShowUploadDialog(true)}>
          <IconUpload className="h-4 w-4 mr-2" />
          Upload Transactions
        </Button>
      </div>
      <TransactionTable
        transactions={data?.items || []}
        isLoading={isLoading || isPreviousData}
        onSearchChange={handleSearchChange}
        showUncategorizedOnly={showUncategorizedOnly}
        onUncategorizedChange={handleUncategorizedChange}
      />
      {(data?.pages > 1) && (
        <PaginationControls
          currentPage={page}
          totalPages={data?.pages || 1}
          onPageChange={setPage}
        />
      )}
      <TransactionUploadDialog
        isOpen={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      />
    </div>
  );
}
