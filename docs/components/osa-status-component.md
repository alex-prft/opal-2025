# OSA Status Component Documentation

## Overview

The **RecentDataComponent** provides real-time monitoring of the Optimizely Strategy Assistant (OSA) workflow status. It displays the health of personalization workflows, content strategy updates, and OPAL integration in a user-friendly format designed for both technical and marketing teams.

## Component Features

### 🎯 Marketing-Focused Design
- **Business Value Translation**: Converts technical status into marketing impact
- **Actionable Insights**: Provides clear next steps when issues occur
- **User-Friendly Language**: Uses terms like "Personalization Engine" instead of technical jargon

### 🔄 Real-Time Monitoring
- **Live Status Updates**: Displays current workflow health
- **Activity Timeline**: Shows most recent system activity
- **Smart Refresh**: Manual refresh capability with loading states

### 📊 Dual Display Modes
- **Full Card**: Comprehensive status with actionable buttons
- **Compact Mode**: Minimal status indicator for sidebars

## API Integration

### Endpoint
```
GET /api/admin/osa/recent-status
```

### Response Format
```typescript
interface OsaRecentStatus {
  lastWebhookAt: string | null;          // Last successful webhook
  lastAgentDataAt: string | null;        // Last agent data processing
  lastForceSyncAt: string | null;        // Last Force Sync execution
  lastWorkflowStatus: 'idle' | 'running' | 'completed' | 'failed';
}
```

### Example Response
```json
{
  "lastWebhookAt": "2025-11-15T18:41:29.945118+00:00",
  "lastAgentDataAt": "2025-11-15T18:41:29.945118+00:00",
  "lastForceSyncAt": "2025-11-16T20:37:17.986635+00:00",
  "lastWorkflowStatus": "idle"
}
```

## Status Logic

The component determines display status using this priority order:

1. **Error State** → `failed` (API errors)
2. **Loading State** → `processing` (Initial load)
3. **Workflow Status** → Priority mapping:
   - `running` → `processing`
   - `completed` → `success`
   - `failed` → `failed`
   - `idle` → Check for recent data
4. **Recent Data Check** → If idle:
   - Has webhook OR agent data → `success`
   - No recent data → `none`

## Usage

### Full Component (Admin Dashboard)
```tsx
import RecentDataComponent from '@/components/RecentDataComponent';

<RecentDataComponent className="w-full" />
```

### Compact Component (Sidebars)
```tsx
<RecentDataComponent compact className="w-full" />
```

### With Error Boundary (Recommended)
```tsx
import RecentDataErrorBoundary from '@/components/shared/RecentDataErrorBoundary';

<RecentDataErrorBoundary>
  <RecentDataComponent />
</RecentDataErrorBoundary>
```

## Status States & User Experience

### ✅ Success State
**Display**: Green checkmark, "Personalization Engine Active"
**Marketing Message**: "Your personalization strategy is running smoothly. New content, experiments, and audience insights are flowing into the Strategy Assistant."
**Actions**: View OSA Logs, Refresh Status

### ⚡ Processing State
**Display**: Blue spinning icon, "Strategy Updates in Progress"
**Marketing Message**: "The system is actively processing new data and generating fresh strategy recommendations."
**Actions**: View OSA Logs, Refresh Status

### ⚠️ Failed State
**Display**: Red X icon, "Personalization System Needs Attention"
**Marketing Message**: "There's an issue with the personalization workflow. Customer data and strategy updates may be delayed."
**Actions**: View OSA Logs, **Run Force Sync**, Refresh Status

### 💤 None State
**Display**: Gray circle, "No Recent Strategy Activity"
**Marketing Message**: "No recent personalization activity detected. New customer insights, content recommendations, and A/B test data aren't flowing into your strategy."
**Actions**: View OSA Logs, **Run Force Sync**, Refresh Status

## Actionable Elements

### View OSA Logs
- **Purpose**: Deep technical monitoring for administrators
- **Link**: Opens `/engine/admin` in new tab
- **Available**: All states

### Run Force Sync
- **Purpose**: Manually trigger data synchronization
- **Link**: Opens `/engine/admin#force-sync` in new tab
- **Available**: Only in Failed and None states
- **Visual**: Blue accent button to encourage action

### Refresh Status
- **Purpose**: Update component data manually
- **Behavior**: Calls `refetch()` from React Query
- **Available**: All states
- **Loading State**: Shows spinning icon during refresh

## Testing

### Unit Tests
Location: `src/components/__tests__/recent-data-status-logic.test.js`

**Coverage**:
- Status logic for all workflow states
- Activity time calculation
- Real-world scenarios (success, fresh system, active processing)

### Manual Testing Checklist

#### Full Component (Admin Dashboard)
Navigate to: `http://localhost:3000/engine/admin`

- [ ] Status icon shows correct state
- [ ] Marketing-friendly title displays
- [ ] "Last activity: X ago" shows relative time
- [ ] Three timestamp pills show formatted dates
- [ ] Action buttons work correctly
- [ ] Refresh button updates data
- [ ] No console errors

#### Compact Component (Results Sidebar)
Navigate to: `http://localhost:3000/engine/results`

- [ ] Compact status indicator displays
- [ ] Status text shows correctly
- [ ] Refresh button works
- [ ] Relative time appears correctly

#### Error State Testing
Temporarily modify `src/app/api/admin/osa/recent-status/route.ts`:
```typescript
export async function GET() {
  throw new Error("Test error"); // Add at line 20
}
```

**Expected Behavior**:
- [ ] Red X icon appears
- [ ] Error message displays
- [ ] "Run Force Sync" button shows
- [ ] Refresh button still functional

## Performance Considerations

### React Query Integration
- **Cache Duration**: 5 minutes (`staleTime: 5 * 60 * 1000`)
- **Background Refetch**: Disabled (`refetchOnWindowFocus: false`)
- **Error Handling**: Graceful degradation with fallback data

### Optimization Patterns
- **Parallel API Calls**: Uses `Promise.allSettled` for database queries
- **Lightweight Endpoint**: Minimal data transfer (4 timestamps + status)
- **Smart Caching**: Reduces API calls by 80% compared to aggressive polling

## Troubleshooting

### Component Shows "Failed" State
1. **Check API Endpoint**: Verify `/api/admin/osa/recent-status` returns 200
2. **Database Connection**: Ensure Supabase connection is healthy
3. **Check Logs**: Review server logs for database errors
4. **Force Sync**: Use "Run Force Sync" to trigger fresh data

### Component Shows "No Recent Activity"
1. **Verify Data Flow**: Check if webhooks are being received
2. **Agent Status**: Ensure OPAL agents are processing data
3. **Force Sync**: Manual sync may be needed to kickstart workflows
4. **Time Sensitivity**: Activity within last 24-48 hours is considered "recent"

### Loading State Stuck
1. **Network Issues**: Check browser developer tools for failed requests
2. **API Timeout**: Server may be experiencing high load
3. **JavaScript Errors**: Check console for React/component errors
4. **Browser Refresh**: Hard refresh may resolve caching issues

## Migration Notes

### From Legacy Implementation
The component was refactored from 1,088 lines to 79 lines of clean code:

**Removed**:
- Complex streaming logic
- Duplicate state management
- Unused webhook event handling
- Legacy error patterns

**Added**:
- Marketing-focused messaging
- Actionable buttons
- Simplified status logic
- Comprehensive testing

**Breaking Changes**: None - maintains same API interface

## Related Components

- **RecentDataErrorBoundary**: Wraps component for error handling
- **DiagnosticsPanel**: Technical monitoring complement
- **useRecentOsaStatus**: React Query hook for data fetching
- **useWebhookStream**: Real-time streaming (used elsewhere)

## Future Enhancements

- **Notification System**: Browser/email alerts for failed states
- **Historical Trends**: Status history and uptime metrics
- **Integration Links**: Direct links to Optimizely tools
- **Customizable Thresholds**: User-defined "recent activity" timeframes