# OSA Endpoint Reference Guide

## 🎯 **OPAL Strategy Assistant Workflow Triggers**

### **Force Sync (Recommended for strategy_workflow)**
```http
POST /api/opal/sync
Content-Type: application/json
Authorization: Bearer {token}

{
  "sync_scope": "priority_platforms",
  "include_rag_update": true,
  "triggered_by": "manual_user_request",
  "client_context": {
    "client_name": "IFPA Strategy Demo",
    "industry": "Food & Beverage"
  }
}
```

**Response:**
```json
{
  "success": true,
  "sync_id": "workflow-uuid",
  "session_id": "session-uuid",
  "message": "Force sync initiated (internal + external OPAL workflows triggered)",
  "polling_url": "/api/opal/status/session-uuid",
  "sync_details": {
    "external_opal": {
      "triggered": true,
      "workflow_id": "opal-workflow-uuid",
      "message": "External OPAL workflow 'strategy_workflow' triggered successfully"
    }
  }
}
```

### **General Workflow Trigger (Form-based)**
```http
POST /api/opal/trigger
Content-Type: application/json

{
  "formData": {
    "client_name": "Client Name",
    "industry": "Technology",
    "business_objectives": ["Improve Conversion Rate"]
  }
}
```

---

## 📊 **Status Monitoring Endpoints**

### **Check Specific Workflow Status**
```http
GET /api/opal/status/{session_id}
```

**Response:**
```json
{
  "workflow": {
    "id": "workflow-uuid",
    "status": "running|completed|failed"
  },
  "progress": {
    "progress_percentage": 75,
    "current_step": "audience_suggester",
    "completed_agents": ["content_review", "geo_audit"],
    "failed_agents": []
  }
}
```

### **General Status Polling**
```http
GET /api/opal/status
```

---

## 🔄 **Complete Workflow Flow**

1. **Trigger:** Call `/api/opal/sync` → Get `session_id`
2. **Monitor:** Poll `/api/opal/status/{session_id}` → Check progress
3. **Complete:** Status becomes `"completed"` → Process results

---

## ❌ **Deprecated/Non-existent Endpoints**

- ~~`/api/sync-status`~~ - **Does not exist** (was in architecture docs)
- ~~`/api/opal/status` as trigger~~ - **Wrong usage** (this is for status polling, not triggering)

---

## 🧪 **Testing**

### Test Force Sync Locally:
```bash
curl -X POST http://localhost:3000/api/opal/sync \
  -H "Content-Type: application/json" \
  -d '{"sync_scope":"priority_platforms","triggered_by":"test"}'
```

### Check if External OPAL Triggered:
```bash
curl -s http://localhost:3000/api/opal/sync \
  -X POST -H "Content-Type: application/json" \
  -d '{"sync_scope":"all_platforms"}' | \
  jq '.sync_details.external_opal.triggered'
```

Result should be `true` if working correctly.