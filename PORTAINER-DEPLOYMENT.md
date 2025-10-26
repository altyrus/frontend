# Deploying via Portainer

Portainer provides a web UI for Kubernetes that makes deployment much easier! This guide shows you how to deploy the Industrial Automation UI using Portainer.

## Benefits of Using Portainer

- ✅ **Visual interface** - No kubectl commands needed
- ✅ **Easy configuration** - Edit YAML in browser
- ✅ **Real-time monitoring** - See pod status, logs, etc.
- ✅ **Quick troubleshooting** - View logs and events in UI
- ✅ **Resource management** - Easy to scale, restart, delete

## Prerequisites

- Portainer installed and accessible
- Access to Portainer with permissions to create resources
- Your MQTT broker URL (e.g., `ws://mqtt-broker:9001`)
- Your API backend URL (e.g., `http://automation-api:8080`)

## Deployment Steps via Portainer

### Step 1: Access Portainer

1. Open Portainer in your browser
2. Log in with your credentials
3. Select your **Kubernetes** environment/cluster

### Step 2: Create Namespace (Optional)

If you want to use a dedicated namespace:

1. Click **Namespaces** in the left menu
2. Click **+ Add namespace**
3. Name: `automation`
4. Click **Create namespace**

Or use an existing namespace like `default`

### Step 3: Deploy the Application

#### Option A: Using Custom Template (Easiest)

1. Click **Custom Templates** in left menu
2. Click **+ Add custom template**
3. Fill in:
   - **Title**: `Industrial Automation UI`
   - **Type**: `Kubernetes`
   - **Resource Pool**: Select your namespace (e.g., `automation`)

4. **Copy the deployment YAML** (see below)
5. **Paste** into the Web editor
6. **Update** the ConfigMap section (lines 79-82) with YOUR URLs
7. Click **Deploy the template**

#### Option B: Using Kubernetes Manifests

1. Click **Applications** in left menu
2. Click **+ Create from manifest**
3. Select **namespace** (e.g., `automation`)
4. **Paste the deployment YAML** below
5. **Update** the ConfigMap section with YOUR URLs
6. Click **Deploy**

### Step 4: Verify Deployment

1. Click **Applications** in left menu
2. Look for `industrial-automation-ui`
3. Should show: **✓ 2/2 ready**

If not ready, click on it to see pod status and logs.

## Complete Deployment YAML

Copy this entire YAML and paste it into Portainer:

**⚠️ IMPORTANT: Update lines 79-82 with your actual MQTT and API URLs before deploying!**

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: automation
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: industrial-automation-ui
  namespace: automation
  labels:
    app: industrial-automation-ui
spec:
  replicas: 2
  selector:
    matchLabels:
      app: industrial-automation-ui
  template:
    metadata:
      labels:
        app: industrial-automation-ui
    spec:
      containers:
      - name: industrial-automation-ui
        image: ghcr.io/altyrus/industrial-automation-ui:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          name: http
        env:
        - name: API_URL
          valueFrom:
            configMapKeyRef:
              name: automation-config
              key: api-url
        - name: MQTT_WS_URL
          valueFrom:
            configMapKeyRef:
              name: automation-config
              key: mqtt-ws-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: industrial-automation-ui
  namespace: automation
  labels:
    app: industrial-automation-ui
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  selector:
    app: industrial-automation-ui
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: automation-config
  namespace: automation
data:
  # ⚠️ UPDATE THESE WITH YOUR ACTUAL URLS ⚠️
  # If MQTT/API are in the same cluster:
  # api-url: "http://service-name.namespace.svc.cluster.local:8080"
  # mqtt-ws-url: "ws://mqtt-broker.namespace.svc.cluster.local:9001"
  # If MQTT/API are external:
  # api-url: "http://192.168.1.100:8080"
  # mqtt-ws-url: "ws://192.168.1.100:9001"
  api-url: "http://automation-api:8080"
  mqtt-ws-url: "ws://mqtt-broker:9001"
```

## Finding Your MQTT and API URLs in Portainer

### If They're in the Same Kubernetes Cluster

1. Click **Applications** in Portainer
2. Find your MQTT broker application
3. Click on it → Note the **Service name** and **Port**
4. Format: `ws://service-name.namespace.svc.cluster.local:port`
5. Repeat for API service

**Example:**
- MQTT Service: `mqtt-broker` in namespace `iot` on port `9001`
- URL: `ws://mqtt-broker.iot.svc.cluster.local:9001`

### If They're External

Use the external IP or hostname:
- MQTT: `ws://192.168.1.100:9001`
- API: `http://192.168.1.100:8080`

### Quick Check Services

1. Click **Services** in left menu
2. Search for your MQTT and API services
3. Note the **Cluster IP** or **External IP**

## Accessing the Application via Portainer

### Method 1: Port Forwarding (Quick Test)

1. Click **Applications** → `industrial-automation-ui`
2. Click on one of the pods
3. Scroll down to **Port forwarding**
4. Add port mapping: `8080` → `80`
5. Click the generated link
6. Add `/kiosk.html` to the URL

### Method 2: Create LoadBalancer Service

1. Click **Services** in left menu
2. Find `industrial-automation-ui`
3. Click **Edit**
4. Change **Type** from `ClusterIP` to `LoadBalancer`
5. Click **Update service**
6. Wait for **External IP** to be assigned
7. Access via: `http://EXTERNAL-IP/kiosk.html`

### Method 3: Create Ingress

1. Click **Ingresses** in left menu
2. Click **+ Add ingress**
3. Fill in:
   - **Name**: `industrial-automation-ui`
   - **Namespace**: `automation`
   - **Hostname**: Your domain (e.g., `automation.example.com`)
   - **Service**: `industrial-automation-ui`
   - **Service port**: `80`
4. Click **Create ingress**
5. Configure DNS to point to ingress IP
6. Access via: `https://automation.example.com/kiosk.html`

### Method 4: NodePort

1. Click **Services** → `industrial-automation-ui`
2. Click **Edit**
3. Change **Type** to `NodePort`
4. Set **Node port**: e.g., `30080` (30000-32767)
5. Click **Update service**
6. Get node IP from **Cluster** → **Nodes**
7. Access via: `http://NODE-IP:30080/kiosk.html`

## Monitoring in Portainer

### View Pod Status

1. Click **Applications** → `industrial-automation-ui`
2. See running pods and their status
3. Click pod name for details

### View Logs

1. Click **Applications** → `industrial-automation-ui`
2. Click on a pod name
3. Click **Logs** tab
4. See real-time application logs
5. Use **Auto-refresh** for live monitoring

### View Events

1. Click **Applications** → `industrial-automation-ui`
2. Scroll to **Application events**
3. See deployment events, errors, warnings

### Resource Usage

1. Click **Applications** → `industrial-automation-ui`
2. See **CPU** and **Memory** usage graphs
3. Monitor per-pod resource consumption

## Updating Configuration

### Update MQTT/API URLs

1. Click **ConfigMaps & Secrets** in left menu
2. Find `automation-config`
3. Click **Edit**
4. Update the URLs
5. Click **Update ConfigMap**
6. Restart pods:
   - Click **Applications** → `industrial-automation-ui`
   - Click **Rollout** → Confirm

### Update Image Version

1. Click **Applications** → `industrial-automation-ui`
2. Click **Edit**
3. Find the **Image** field
4. Change tag: `ghcr.io/altyrus/industrial-automation-ui:v1.0.0`
5. Click **Update application**

### Scale Replicas

1. Click **Applications** → `industrial-automation-ui`
2. Click **Edit**
3. Change **Replicas** count (e.g., from 2 to 4)
4. Click **Update application**

## Troubleshooting in Portainer

### Pods Not Starting

1. Click **Applications** → `industrial-automation-ui`
2. Click on pod with issue
3. Check **Events** section at bottom
4. Common issues:
   - **ImagePullBackOff**: Can't pull image
   - **CrashLoopBackOff**: Container crashing
   - **Pending**: Not enough resources

### Check Logs

1. Click **Applications** → `industrial-automation-ui`
2. Click pod name
3. Click **Logs** tab
4. Look for errors (usually in red)
5. Enable **Auto-refresh** to watch live

### Test Connectivity

1. Click **Applications** → `industrial-automation-ui`
2. Click pod name
3. Click **Console** tab
4. Click **Connect**
5. Run test commands:
   ```sh
   # Test API connectivity
   wget -O- http://automation-api:8080

   # Test MQTT connectivity
   nc -zv mqtt-broker 9001
   ```

### Restart Application

1. Click **Applications** → `industrial-automation-ui`
2. Click **Rollout** button
3. Confirm restart
4. Pods will restart with zero downtime (rolling update)

## Complete Example: Step-by-Step

Let's say you have:
- MQTT broker running as service `mosquitto` in namespace `iot` on port `9001`
- API running as service `automation-api` in namespace `automation` on port `8080`

**Step 1: Log into Portainer**

**Step 2: Create from manifest**
- Click **Applications** → **+ Create from manifest**
- Select namespace: `automation` (or create new)

**Step 3: Paste the YAML above and edit lines 79-82:**
```yaml
data:
  api-url: "http://automation-api.automation.svc.cluster.local:8080"
  mqtt-ws-url: "ws://mosquitto.iot.svc.cluster.local:9001"
```

**Step 4: Click Deploy**

**Step 5: Wait for pods to start**
- Should see "2/2 ready" after ~30 seconds

**Step 6: Test with port forward**
- Click on application → Click pod → Port forwarding
- Map `8080` → `80`
- Open link, add `/kiosk.html`

**Done!** 🎉

## Portainer Advantages for This Project

### Easy Updates
- Click → Edit → Save (no YAML editing needed)
- Rolling updates with zero downtime
- Easy rollback if issues

### Visual Monitoring
- See pod status at a glance
- Resource usage graphs
- Real-time logs

### Quick Troubleshooting
- Console access to pods
- Event viewer
- Log streaming

### Team Friendly
- Share Portainer access
- No kubectl installation needed
- Web-based management

## Screenshots Guide

While using Portainer, you'll see:

1. **Dashboard** - Overview of cluster
2. **Applications** - List of deployments (your app will be here)
3. **Services** - Network services
4. **ConfigMaps** - Configuration data
5. **Ingresses** - HTTP routing rules
6. **Namespaces** - Resource grouping

## Quick Reference

### Deploy
1. Applications → + Create from manifest
2. Paste YAML (update ConfigMap)
3. Deploy

### Access
1. Applications → industrial-automation-ui → Pod → Port forward
2. Or create LoadBalancer/Ingress

### Monitor
1. Applications → industrial-automation-ui
2. View pods, logs, events

### Update Config
1. ConfigMaps → automation-config → Edit
2. Applications → industrial-automation-ui → Rollout

### Scale
1. Applications → industrial-automation-ui → Edit
2. Change replica count → Update

## Next Steps

After deploying via Portainer:

1. **Test the application** - Port forward and access kiosk.html
2. **Monitor logs** - Check for connection to MQTT and API
3. **Set up access** - Choose LoadBalancer, Ingress, or NodePort
4. **Configure kiosks** - Point browsers to the URL

## Support

- **Portainer docs**: https://docs.portainer.io/
- **Project README**: [README.md](README.md)
- **Kubectl alternative**: [KUBERNETES-DEPLOYMENT-CHECKLIST.md](KUBERNETES-DEPLOYMENT-CHECKLIST.md)

---

**Using Portainer makes Kubernetes deployment as easy as copy-paste-click!** 🚀
