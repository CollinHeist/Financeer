'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { IconInfoCircle } from '@tabler/icons-react';
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getAllAccounts } from '@/lib/api/accounts';
import { uploadTransactions } from '@/lib/api/upload';

const FILE_TYPES = {
  generic: {
    name: 'Generic CSV',
    description: '.csv with the columns: date, description, note, amount',
    endpoint: 'generic'
  },
  apple: {
    name: 'Apple Card',
    description: '',
    endpoint: 'apple'
  },
  capital_one: {
    name: 'Capital One',
    description: '',
    endpoint: 'capital-one'
  },
  chase: {
    name: 'Chase (Amazon)',
    description: '',
    endpoint: 'chase'
  },
  iccu: {
    name: 'ICCU',
    description: '',
    endpoint: 'iccu'
  },
  citi: {
    name: 'Citi Bank',
    description: '',
    endpoint: 'citi'
  },
  vanguard: {
    name: 'Vanguard',
    description: '',
    endpoint: 'vanguard'
  },
};

export default function TransactionUploadDialog({ isOpen, onOpenChange }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAllAccounts,
    enabled: isOpen
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      return uploadTransactions(selectedFileType.endpoint, selectedFiles, selectedAccount.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error uploading transactions:', error);
    },
  });

  const resetForm = () => {
    setSelectedAccount(null);
    setSelectedFiles([]);
    setSelectedFileType(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedAccount || selectedFiles.length === 0 || !selectedFileType) return;
    await uploadMutation.mutateAsync();
  };

  const isLoading = uploadMutation.isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Transactions</DialogTitle>
          <DialogDescription>
            Select the type of transaction file you're uploading and choose the corresponding account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">File Type</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  {selectedFileType?.name || 'Select file type'}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {Object.values(FILE_TYPES).map((type) => (
                  <DropdownMenuItem
                    key={type.endpoint}
                    onSelect={() => setSelectedFileType(type)}
                  >
                    <div>
                      <div className="font-medium">{type.name}</div>
                      {type.description && (
                        <div className="text-xs text-gray-500">{type.description}</div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Account</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  {selectedAccount?.name || 'Select an account'}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {accounts?.map(account => (
                  <DropdownMenuItem
                    key={account.id}
                    onSelect={() => setSelectedAccount(account)}
                  >
                    {account.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Files</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
                multiple
              />
            </div>
            {selectedFiles.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Selected files:</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  {selectedFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUpload}
              disabled={isLoading || !selectedAccount || selectedFiles.length === 0 || !selectedFileType}
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
