'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getAccount } from '@/lib/api';

export function BreadcrumbWrapper() {
  const pathname = usePathname();
  
  if (pathname === '/') {
    return null;
  }
  
  const segments = pathname.split('/').filter(Boolean);
  
  // Check if we're on an account details page
  const isAccountDetailsPage = 
    segments.length >= 2 && 
    segments[0] === 'accounts' && 
    !isNaN(parseInt(segments[1]));
  
  const accountId = isAccountDetailsPage ? parseInt(segments[1]) : null;
  
  // Fetch account data if we're on an account details page
  const { data: account, isLoading } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => getAccount(accountId),
    enabled: !!accountId, // Only run the query if accountId exists
  });

  return (
    <Breadcrumb className="py-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        
        {segments.map((segment, index) => {
          // Skip the account ID segment when we have the actual account data
          if (isAccountDetailsPage && index === 1 && account) {
            return null;
          }
          
          const isLast = index === segments.length - 1;
          const path = `/${segments.slice(0, index + 1).join('/')}`;
          
          // Determine what text to display
          let displayName;
          if (index === 0) {
            // First segment (like "accounts") - capitalize it
            displayName = segment.charAt(0).toUpperCase() + segment.slice(1);
          } else if (isAccountDetailsPage && index === 1) {
            // We're rendering the account ID but don't have account data yet
            displayName = isLoading ? "Loading..." : "Account";
          } else {
            // Other segments - just capitalize
            displayName = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
          
          return (
            <React.Fragment key={path}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={path}>{displayName}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
        
        {/* Add account name when we have the data */}
        {isAccountDetailsPage && account && (
          <>
            <BreadcrumbItem>
              <BreadcrumbPage>{account.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
