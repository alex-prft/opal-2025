'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  Share2,
  FileText,
  FileSpreadsheet,
  Image,
  Mail,
  Link,
  Copy,
  Check,
  Calendar,
  Users,
  Settings,
  Clock
} from 'lucide-react';

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'export' | 'share';
  contentType: string;
  contentTitle: string;
}

const exportFormats = [
  { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Professional report format' },
  { value: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet, description: 'Data analysis format' },
  { value: 'png', label: 'PNG Image', icon: Image, description: 'Visual snapshot' },
  { value: 'json', label: 'JSON Data', icon: FileText, description: 'Raw data format' }
];

const shareOptions = [
  { value: 'email', label: 'Email', icon: Mail, description: 'Send via email' },
  { value: 'link', label: 'Share Link', icon: Link, description: 'Generate shareable link' },
  { value: 'embed', label: 'Embed Code', icon: Copy, description: 'Embed in website' }
];

export default function ExportShareModal({
  isOpen,
  onClose,
  mode,
  contentType,
  contentTitle
}: ExportShareModalProps) {
  const [selectedFormat, setSelectedFormat] = useState('');
  const [shareMethod, setShareMethod] = useState('');
  const [emailList, setEmailList] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [includeComments, setIncludeComments] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    setIsProcessing(true);
    // Simulate export process
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      // In a real app, trigger download here
    }, 2000);
  };

  const handleShare = async () => {
    setIsProcessing(true);
    // Simulate share process
    setTimeout(() => {
      if (shareMethod === 'link') {
        setGeneratedLink(`https://strategy.ifpa.com/results/${contentType}/shared/${Math.random().toString(36).substr(2, 9)}`);
      }
      setIsProcessing(false);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderExportContent = () => (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Export Format</Label>
        <div className="grid grid-cols-1 gap-3">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.value}
                onClick={() => setSelectedFormat(format.value)}
                className={`flex items-center p-3 border rounded-lg transition-all ${
                  selectedFormat === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{format.label}</div>
                  <div className="text-xs text-muted-foreground">{format.description}</div>
                </div>
                {selectedFormat === format.value && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Export Options</Label>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-comments"
              checked={includeComments}
              onCheckedChange={setIncludeComments}
            />
            <Label htmlFor="include-comments" className="text-sm">
              Include comments and annotations
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-raw-data"
              checked={includeRawData}
              onCheckedChange={setIncludeRawData}
            />
            <Label htmlFor="include-raw-data" className="text-sm">
              Include raw data tables
            </Label>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleExport}
        disabled={!selectedFormat || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Exporting...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export {contentTitle}
          </div>
        )}
      </Button>
    </div>
  );

  const renderShareContent = () => (
    <div className="space-y-6">
      {/* Share Method Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Share Method</Label>
        <div className="grid grid-cols-1 gap-3">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setShareMethod(option.value)}
                className={`flex items-center p-3 border rounded-lg transition-all ${
                  shareMethod === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
                {shareMethod === option.value && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Email Sharing */}
      {shareMethod === 'email' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-list" className="text-sm font-medium">
              Email Recipients
            </Label>
            <Textarea
              id="email-list"
              placeholder="Enter email addresses separated by commas"
              value={emailList}
              onChange={(e) => setEmailList(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="share-message" className="text-sm font-medium">
              Message (Optional)
            </Label>
            <Textarea
              id="share-message"
              placeholder="Add a personal message..."
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Link Sharing Options */}
      {shareMethod === 'link' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="access-level" className="text-sm font-medium">
                Access Level
              </Label>
              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">View & Comment</SelectItem>
                  <SelectItem value="edit">Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiration" className="text-sm font-medium">
                Link Expires
              </Label>
              <Select value={expirationDate} onValueChange={setExpirationDate}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                  <SelectItem value="90days">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {generatedLink && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <Label className="text-sm font-medium text-green-800 mb-2 block">
                  Share Link Generated
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="bg-white border-green-300"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedLink)}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Share Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Share Settings</Label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Allow recipients to share</span>
            </div>
            <Checkbox defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Require password</span>
            </div>
            <Checkbox />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Track view analytics</span>
            </div>
            <Checkbox defaultChecked />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleShare}
        disabled={!shareMethod || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Processing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share {contentTitle}
          </div>
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'export' ? (
              <>
                <Download className="h-5 w-5" />
                Export Results
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5" />
                Share Results
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export'
              ? `Export "${contentTitle}" in your preferred format`
              : `Share "${contentTitle}" with your team or stakeholders`
            }
          </DialogDescription>
        </DialogHeader>

        {mode === 'export' ? renderExportContent() : renderShareContent()}
      </DialogContent>
    </Dialog>
  );
}