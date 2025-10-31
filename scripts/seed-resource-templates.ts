import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const popularResourceTemplates = [
  {
    name: "Virtual Machine",
    description: "Cloud virtual machine instances with configurable specifications",
    fields: [
      { name: "vcpus", label: "vCPUs", fieldType: "NUMBER", isRequired: true, defaultValue: "2", unit: "cores", minValue: 1, maxValue: 64 },
      { name: "ram", label: "RAM", fieldType: "NUMBER", isRequired: true, defaultValue: "4", unit: "GB", minValue: 1, maxValue: 512 },
      { name: "storage", label: "Storage", fieldType: "NUMBER", isRequired: true, defaultValue: "20", unit: "GB", minValue: 8, maxValue: 4000 },
      { name: "storageType", label: "Storage Type", fieldType: "SELECT", isRequired: true, defaultValue: "SSD", options: ["SSD", "HDD", "NVMe"] },
      { name: "operatingSystem", label: "Operating System", fieldType: "SELECT", isRequired: true, defaultValue: "Ubuntu 22.04", options: ["Ubuntu 22.04", "Ubuntu 20.04", "Windows Server 2022", "Windows Server 2019", "CentOS 8", "RHEL 8", "Debian 11"] },
      { name: "region", label: "Region", fieldType: "SELECT", isRequired: true, defaultValue: "us-east-1", options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] },
      { name: "instanceType", label: "Instance Type", fieldType: "SELECT", isRequired: false, defaultValue: "General Purpose", options: ["General Purpose", "Compute Optimized", "Memory Optimized", "Storage Optimized", "GPU Instance"] }
    ]
  },
  {
    name: "Database Server",
    description: "Managed database instances with various engines and configurations",
    fields: [
      { name: "engine", label: "Database Engine", fieldType: "SELECT", isRequired: true, defaultValue: "PostgreSQL", options: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "MariaDB", "SQL Server", "Oracle"] },
      { name: "version", label: "Engine Version", fieldType: "TEXT", isRequired: true, defaultValue: "14.0" },
      { name: "instanceClass", label: "Instance Class", fieldType: "SELECT", isRequired: true, defaultValue: "db.t3.medium", options: ["db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large", "db.r5.large", "db.r5.xlarge", "db.r5.2xlarge"] },
      { name: "storage", label: "Storage", fieldType: "NUMBER", isRequired: true, defaultValue: "100", unit: "GB", minValue: 20, maxValue: 16000 },
      { name: "storageType", label: "Storage Type", fieldType: "SELECT", isRequired: true, defaultValue: "gp2", options: ["gp2", "gp3", "io1", "io2"] },
      { name: "multiAZ", label: "Multi-AZ Deployment", fieldType: "BOOLEAN", isRequired: false, defaultValue: "false" },
      { name: "backupRetention", label: "Backup Retention", fieldType: "NUMBER", isRequired: false, defaultValue: "7", unit: "days", minValue: 0, maxValue: 35 },
      { name: "region", label: "Region", fieldType: "SELECT", isRequired: true, defaultValue: "us-east-1", options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] }
    ]
  },
  {
    name: "Network Switch",
    description: "Network switches for data center and enterprise networking",
    fields: [
      { name: "ports", label: "Number of Ports", fieldType: "SELECT", isRequired: true, defaultValue: "24", options: ["8", "16", "24", "48", "96"] },
      { name: "portSpeed", label: "Port Speed", fieldType: "SELECT", isRequired: true, defaultValue: "1 Gbps", options: ["100 Mbps", "1 Gbps", "10 Gbps", "25 Gbps", "40 Gbps", "100 Gbps"] },
      { name: "switchType", label: "Switch Type", fieldType: "SELECT", isRequired: true, defaultValue: "Managed", options: ["Managed", "Unmanaged", "Smart/Web Managed"] },
      { name: "poeSupport", label: "PoE Support", fieldType: "SELECT", isRequired: false, defaultValue: "PoE+", options: ["None", "PoE", "PoE+", "PoE++"] },
      { name: "stackable", label: "Stackable", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "rackUnits", label: "Rack Units", fieldType: "NUMBER", isRequired: true, defaultValue: "1", unit: "U", minValue: 1, maxValue: 4 },
      { name: "vlanSupport", label: "VLAN Support", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "manufacturer", label: "Manufacturer", fieldType: "SELECT", isRequired: false, defaultValue: "Cisco", options: ["Cisco", "HP Enterprise", "Juniper", "Dell", "Netgear", "TP-Link", "Ubiquiti"] }
    ]
  },
  {
    name: "Storage Volume",
    description: "Block storage volumes for persistent data storage",
    fields: [
      { name: "size", label: "Size", fieldType: "NUMBER", isRequired: true, defaultValue: "100", unit: "GB", minValue: 1, maxValue: 64000 },
      { name: "volumeType", label: "Volume Type", fieldType: "SELECT", isRequired: true, defaultValue: "gp3", options: ["gp2", "gp3", "io1", "io2", "st1", "sc1"] },
      { name: "iops", label: "IOPS", fieldType: "NUMBER", isRequired: false, defaultValue: "3000", unit: "IOPS", minValue: 100, maxValue: 64000 },
      { name: "throughput", label: "Throughput", fieldType: "NUMBER", isRequired: false, defaultValue: "125", unit: "MB/s", minValue: 125, maxValue: 1000 },
      { name: "encrypted", label: "Encryption", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "snapshotId", label: "Source Snapshot ID", fieldType: "TEXT", isRequired: false },
      { name: "region", label: "Region", fieldType: "SELECT", isRequired: true, defaultValue: "us-east-1", options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] },
      { name: "availabilityZone", label: "Availability Zone", fieldType: "TEXT", isRequired: false, defaultValue: "us-east-1a" }
    ]
  },
  {
    name: "Load Balancer",
    description: "Application and network load balancers for traffic distribution",
    fields: [
      { name: "type", label: "Load Balancer Type", fieldType: "SELECT", isRequired: true, defaultValue: "Application", options: ["Application", "Network", "Gateway", "Classic"] },
      { name: "scheme", label: "Scheme", fieldType: "SELECT", isRequired: true, defaultValue: "Internet-facing", options: ["Internet-facing", "Internal"] },
      { name: "listeners", label: "Number of Listeners", fieldType: "NUMBER", isRequired: true, defaultValue: "1", minValue: 1, maxValue: 50 },
      { name: "protocol", label: "Protocol", fieldType: "SELECT", isRequired: true, defaultValue: "HTTPS", options: ["HTTP", "HTTPS", "TCP", "UDP", "TLS"] },
      { name: "port", label: "Port", fieldType: "NUMBER", isRequired: true, defaultValue: "443", minValue: 1, maxValue: 65535 },
      { name: "sslCertificate", label: "SSL Certificate", fieldType: "TEXT", isRequired: false },
      { name: "healthCheckPath", label: "Health Check Path", fieldType: "TEXT", isRequired: false, defaultValue: "/" },
      { name: "region", label: "Region", fieldType: "SELECT", isRequired: true, defaultValue: "us-east-1", options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] }
    ]
  },
  {
    name: "Container Registry",
    description: "Private container image registry for storing Docker images",
    fields: [
      { name: "registryName", label: "Registry Name", fieldType: "TEXT", isRequired: true },
      { name: "storageSize", label: "Storage Size", fieldType: "NUMBER", isRequired: true, defaultValue: "10", unit: "GB", minValue: 1, maxValue: 1000 },
      { name: "imageScanning", label: "Image Scanning", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "immutableTags", label: "Immutable Tags", fieldType: "BOOLEAN", isRequired: false, defaultValue: "false" },
      { name: "lifecyclePolicy", label: "Lifecycle Policy", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "publicAccess", label: "Public Access", fieldType: "BOOLEAN", isRequired: false, defaultValue: "false" },
      { name: "region", label: "Region", fieldType: "SELECT", isRequired: true, defaultValue: "us-east-1", options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] }
    ]
  },
  {
    name: "CDN Distribution",
    description: "Content Delivery Network for global content distribution",
    fields: [
      { name: "originDomain", label: "Origin Domain", fieldType: "TEXT", isRequired: true },
      { name: "cachePolicy", label: "Cache Policy", fieldType: "SELECT", isRequired: true, defaultValue: "Managed-CachingOptimized", options: ["Managed-CachingOptimized", "Managed-CachingDisabled", "Managed-Amplify", "Custom"] },
      { name: "priceClass", label: "Price Class", fieldType: "SELECT", isRequired: true, defaultValue: "PriceClass_All", options: ["PriceClass_100", "PriceClass_200", "PriceClass_All"] },
      { name: "sslCertificate", label: "SSL Certificate ARN", fieldType: "TEXT", isRequired: false },
      { name: "customDomain", label: "Custom Domain", fieldType: "TEXT", isRequired: false },
      { name: "gzipCompression", label: "Gzip Compression", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "httpVersion", label: "HTTP Version", fieldType: "SELECT", isRequired: false, defaultValue: "http2", options: ["http1.1", "http2"] },
      { name: "ipv6", label: "IPv6 Support", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" }
    ]
  },
  {
    name: "Kubernetes Cluster",
    description: "Managed Kubernetes cluster for container orchestration",
    fields: [
      { name: "clusterName", label: "Cluster Name", fieldType: "TEXT", isRequired: true },
      { name: "version", label: "Kubernetes Version", fieldType: "SELECT", isRequired: true, defaultValue: "1.28", options: ["1.26", "1.27", "1.28", "1.29"] },
      { name: "nodeGroups", label: "Number of Node Groups", fieldType: "NUMBER", isRequired: true, defaultValue: "1", minValue: 1, maxValue: 10 },
      { name: "nodeInstanceType", label: "Node Instance Type", fieldType: "SELECT", isRequired: true, defaultValue: "t3.medium", options: ["t3.small", "t3.medium", "t3.large", "t3.xlarge", "m5.large", "m5.xlarge", "c5.large", "c5.xlarge"] },
      { name: "minNodes", label: "Minimum Nodes", fieldType: "NUMBER", isRequired: true, defaultValue: "1", minValue: 0, maxValue: 100 },
      { name: "maxNodes", label: "Maximum Nodes", fieldType: "NUMBER", isRequired: true, defaultValue: "5", minValue: 1, maxValue: 100 },
      { name: "desiredNodes", label: "Desired Nodes", fieldType: "NUMBER", isRequired: true, defaultValue: "2", minValue: 1, maxValue: 100 },
      { name: "diskSize", label: "Node Disk Size", fieldType: "NUMBER", isRequired: true, defaultValue: "20", unit: "GB", minValue: 20, maxValue: 500 },
      { name: "region", label: "Region", fieldType: "SELECT", isRequired: true, defaultValue: "us-east-1", options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] }
    ]
  },
  {
    name: "Firewall",
    description: "Network firewall for security and access control",
    fields: [
      { name: "firewallType", label: "Firewall Type", fieldType: "SELECT", isRequired: true, defaultValue: "Application", options: ["Network", "Application", "Web Application", "Next-Gen"] },
      { name: "throughput", label: "Throughput", fieldType: "SELECT", isRequired: true, defaultValue: "1 Gbps", options: ["100 Mbps", "500 Mbps", "1 Gbps", "5 Gbps", "10 Gbps", "20 Gbps"] },
      { name: "interfaces", label: "Number of Interfaces", fieldType: "NUMBER", isRequired: true, defaultValue: "4", minValue: 2, maxValue: 64 },
      { name: "vpnSupport", label: "VPN Support", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "ipsSupport", label: "IPS Support", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "highAvailability", label: "High Availability", fieldType: "BOOLEAN", isRequired: false, defaultValue: "false" },
      { name: "managementType", label: "Management Type", fieldType: "SELECT", isRequired: true, defaultValue: "Cloud Managed", options: ["Cloud Managed", "On-Premise", "Hybrid"] },
      { name: "manufacturer", label: "Manufacturer", fieldType: "SELECT", isRequired: false, defaultValue: "Palo Alto", options: ["Palo Alto", "Cisco", "Fortinet", "SonicWall", "pfSense", "Juniper", "Check Point"] }
    ]
  },
  {
    name: "Backup Storage",
    description: "Backup and archival storage solutions",
    fields: [
      { name: "storageSize", label: "Storage Size", fieldType: "NUMBER", isRequired: true, defaultValue: "500", unit: "GB", minValue: 10, maxValue: 100000 },
      { name: "storageClass", label: "Storage Class", fieldType: "SELECT", isRequired: true, defaultValue: "Standard", options: ["Standard", "Standard-IA", "Glacier", "Glacier Deep Archive", "Intelligent Tiering"] },
      { name: "retentionPeriod", label: "Retention Period", fieldType: "NUMBER", isRequired: true, defaultValue: "30", unit: "days", minValue: 1, maxValue: 2555 },
      { name: "encryption", label: "Encryption", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "versionning", label: "Versioning", fieldType: "BOOLEAN", isRequired: false, defaultValue: "true" },
      { name: "crossRegionReplication", label: "Cross Region Replication", fieldType: "BOOLEAN", isRequired: false, defaultValue: "false" },
      { name: "accessFrequency", label: "Access Frequency", fieldType: "SELECT", isRequired: true, defaultValue: "Monthly", options: ["Daily", "Weekly", "Monthly", "Yearly", "Archive Only"] },
      { name: "region", label: "Region", fieldType: "SELECT", isRequired: true, defaultValue: "us-east-1", options: ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] }
    ]
  }
]

async function main() {
  console.log('🌱 Starting to seed resource templates...')

  try {
    // Check if templates already exist
    const existingTemplates = await prisma.resourceTemplate.findMany()
    
    if (existingTemplates.length > 0) {
      console.log('📋 Resource templates already exist. Skipping seeding.')
      return
    }

    for (const template of popularResourceTemplates) {
      console.log(`📦 Creating template: ${template.name}`)
      
      await prisma.resourceTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          isActive: true,
          fields: {
            create: template.fields.map((field: any, index) => ({
              name: field.name,
              label: field.label,
              fieldType: field.fieldType as any,
              isRequired: field.isRequired,
              defaultValue: field.defaultValue || null,
              options: field.options ? JSON.stringify(field.options) : null,
              unit: field.unit || null,
              minValue: field.minValue || null,
              maxValue: field.maxValue || null,
              sortOrder: index
            }))
          }
        }
      })
      
      console.log(`✅ Created: ${template.name}`)
    }

    console.log('🎉 Successfully seeded all resource templates!')
  } catch (error) {
    console.error('❌ Error seeding resource templates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })