const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Add policyVersions relation to User model if not present
if (!schema.includes('policyVersions  LegalPolicyVersion[]')) {
  schema = schema.replace(
    '  managedWebsites ManagedWebsite[]',
    '  managedWebsites ManagedWebsite[]\r\n  policyVersions  LegalPolicyVersion[]'
  );
}

// 2. Add LegalPolicyVersion model if not present
if (!schema.includes('model LegalPolicyVersion')) {
  const modelText = `

model LegalPolicyVersion {
  id               Int       @id @default(autoincrement()) @map("id")
  policyType       String    @map("policy_type") @db.VarChar(50)
  title            String    @db.VarChar(255)
  version          String    @db.VarChar(30)
  content          String    @db.NVarChar(Max)
  summaryOfChanges String?   @map("summary_of_changes") @db.NVarChar(Max)
  status           String    @default("PUBLISHED") @db.VarChar(20)
  isCurrent        Boolean   @default(false) @map("is_current")
  effectiveAt      DateTime  @default(now()) @map("effective_at")
  publishedAt      DateTime? @map("published_at")
  archivedAt       DateTime? @map("archived_at")
  lastNotifiedAt   DateTime? @map("last_notified_at")
  notifiedCount    Int       @default(0) @map("notified_count")
  createdById      Int?      @map("created_by_id")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @default(now()) @updatedAt @map("updated_at")

  createdBy        User?     @relation(fields: [createdById], references: [userId], onDelete: SetNull)

  @@index([policyType, isCurrent], map: "ix_policy_type_current")
  @@index([policyType, version], map: "ix_policy_type_version")
  @@map("Legal_Policy_Versions")
}
`;
  schema += modelText;
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Appended model to schema.prisma successfully!');
