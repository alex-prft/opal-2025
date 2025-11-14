'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ArrowUpDown, Search, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { MappingTableRow } from '@/lib/mapping-utils';

interface MappingTableProps {
  data: MappingTableRow[];
  isLoading?: boolean;
}

type SortField = 'tier1' | 'tier2' | 'status';
type SortDirection = 'asc' | 'desc';

export default function MappingTable({ data = [], isLoading = false }: MappingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('tier1');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(row =>
        row.tier1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.tier2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.tier3.some(t3 => t3.toLowerCase().includes(searchTerm.toLowerCase())) ||
        row.opal_agents.some(agent => agent.toLowerCase().includes(searchTerm.toLowerCase())) ||
        row.opal_tools.some(tool => tool.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'tier1':
          aValue = a.tier1;
          bValue = b.tier1;
          break;
        case 'tier2':
          aValue = a.tier2;
          bValue = b.tier2;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.tier1;
          bValue = b.tier1;
      }

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: 'complete' | 'partial' | 'missing' }) => {
    const config = {
      complete: {
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Complete',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      partial: {
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Partial',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      missing: {
        icon: <XCircle className="h-3 w-3" />,
        label: 'Missing',
        className: 'bg-red-100 text-red-800 border-red-200'
      }
    };

    const { icon, label, className } = config[status];

    return (
      <Badge variant="outline" className={className}>
        {icon}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  // Sort header component
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium text-left justify-start"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapping Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading mapping data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>OPAL Mapping Table</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search mappings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedData.length} of {data.length} mapping configurations
        </p>
      </CardHeader>
      <CardContent>
        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No mappings match your search criteria' : 'No mapping data available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">
                    <SortableHeader field="tier1">Tier 1</SortableHeader>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <SortableHeader field="tier2">Tier 2</SortableHeader>
                  </TableHead>
                  <TableHead className="min-w-[200px]">Tier 3</TableHead>
                  <TableHead className="min-w-[150px]">Agents</TableHead>
                  <TableHead className="min-w-[150px]">Tools</TableHead>
                  <TableHead className="min-w-[150px]">DXP Tools</TableHead>
                  <TableHead className="min-w-[200px]">Endpoints</TableHead>
                  <TableHead className="min-w-[100px]">
                    <SortableHeader field="status">Status</SortableHeader>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((row, index) => (
                  <TableRow key={`${row.tier1}-${row.tier2}-${index}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{row.tier1}</TableCell>
                    <TableCell>{row.tier2}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        {row.tier3.length > 0 ? (
                          <div className="text-sm">
                            {row.tier3.map((item, idx) => (
                              <div key={idx} className="mb-1 text-gray-700">
                                • {item}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No tier3 configured</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.opal_agents.length > 0 ? (
                          row.opal_agents.map((agent, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {agent}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">No agents</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.opal_tools.length > 0 ? (
                          row.opal_tools.map((tool, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">No tools</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.dxp_tools.length > 0 ? (
                          row.dxp_tools.map((tool, idx) => (
                            <Badge key={idx} variant="default" className="text-xs bg-blue-100 text-blue-800">
                              {tool}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">No DXP tools</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] text-xs">
                        {row.result_endpoints.length > 0 ? (
                          row.result_endpoints.map((endpoint, idx) => (
                            <div key={idx} className="mb-1 text-gray-600 font-mono">
                              {endpoint}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">No endpoints</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}