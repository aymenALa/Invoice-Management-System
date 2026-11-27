import {
  DemoClient,
  DemoInboxMessage,
  DemoInvitation,
  DemoInvoice,
  DemoPortalAccount,
  DemoUser,
  InvoiceStatus
} from './demo-models';

export interface DemoSeedBundle {
  users: DemoUser[];
  clients: DemoClient[];
  invoices: DemoInvoice[];
  invitations: DemoInvitation[];
  portal_accounts: DemoPortalAccount[];
  demo_inbox: DemoInboxMessage[];
}

export function createDemoSeedData(): DemoSeedBundle {
  const now = new Date();
  const plus7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const created = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const users: DemoUser[] = [
    {
      id: 1,
      username: 'alex.mercer',
      email: 'alex@northstarbilling.example',
      firstName: 'Alex',
      lastName: 'Mercer',
      password: 'DemoUserPass1!',
      enabled: true
    },
    {
      id: 2,
      username: 'sara.lin',
      email: 'sara@harborops.example',
      firstName: 'Sara',
      lastName: 'Lin',
      password: 'DemoUserPass2!',
      enabled: true
    }
  ];

  const clients: DemoClient[] = [
    // Business 1 (alex.mercer) - 13 clients
    { id: 1, userId: 1, name: 'Northwind Studio', email: 'billing@northwindstudio.example', phoneNumber: '+15550101001', address: '420 Pine Street, Suite 300, Seattle, WA 98101' },
    { id: 2, userId: 1, name: 'Cobalt Logistics', email: 'accounts@cobaltlogistics.example', phoneNumber: '+15550101002', address: '880 Harbor Blvd, Floor 12, Portland, OR 97204' },
    { id: 3, userId: 1, name: 'Verdant Labs', email: 'finance@verdantlabs.example', phoneNumber: '+15550101003', address: '155 Oakridge Ave, Austin, TX 78701' },
    { id: 4, userId: 1, name: 'Apex Horizon Partners', email: 'ap@apexhorizon.example', phoneNumber: '+15550101004', address: '9900 Wilshire Way, Suite 1400, Los Angeles, CA 90017' },
    { id: 5, userId: 1, name: 'Crestline Advisory', email: 'payables@crestlineadvisory.example', phoneNumber: '+15550101005', address: '210 Congress Ave, Austin, TX 78701' },
    { id: 6, userId: 1, name: 'Helios Freight Systems', email: 'invoices@heliosfreight.example', phoneNumber: '+15550101006', address: '740 Westlake Ave N, Seattle, WA 98109' },
    { id: 7, userId: 1, name: 'Beacon Analytics', email: 'finance@beaconanalytics.example', phoneNumber: '+15550101007', address: '310 Mission St, San Francisco, CA 94105' },
    { id: 8, userId: 1, name: 'Ironwood Energy', email: 'ap@ironwoodenergy.example', phoneNumber: '+15550101008', address: '1200 Smith St, Houston, TX 77002' },
    { id: 9, userId: 1, name: 'Kestrel Media Group', email: 'billing@kestrelmedia.example', phoneNumber: '+15550101009', address: '450 Lexington Ave, New York, NY 10017' },
    { id: 10, userId: 1, name: 'Silverline Bio', email: 'accounts@silverlinebio.example', phoneNumber: '+15550101010', address: '600 Kendall Sq, Cambridge, MA 02139' },
    { id: 11, userId: 1, name: 'Cascade Architecture', email: 'studio@cascadearch.example', phoneNumber: '+15550101011', address: '1120 NW Couch St, Portland, OR 97209' },
    { id: 12, userId: 1, name: 'Meridian Cloud Ops', email: 'finance@meridiancloud.example', phoneNumber: '+15550101012', address: '1800 Larimer St, Denver, CO 80202' },
    { id: 13, userId: 1, name: 'Oakhaven Manufacturing', email: 'ap@oakhavenmfg.example', phoneNumber: '+15550101013', address: '500 Woodward Ave, Detroit, MI 48226' },

    // Business 2 (sara.lin) - 5 clients
    { id: 14, userId: 2, name: 'Solstice Retail Group', email: 'payables@solsticeretail.example', phoneNumber: '+15550102001', address: '710 Market Street, San Francisco, CA 94102' },
    { id: 15, userId: 2, name: 'Pacific Marine Supply', email: 'accounts@pacificmarine.example', phoneNumber: '+15550102002', address: '88 Embarcadero, San Diego, CA 92101' },
    { id: 16, userId: 2, name: 'Redwood Timber Co', email: 'billing@redwoodtimber.example', phoneNumber: '+15550102003', address: '220 Alder St, Eugene, OR 97401' },
    { id: 17, userId: 2, name: 'Summit Robotics', email: 'finance@summitrobotics.example', phoneNumber: '+15550102004', address: '950 Page Mill Rd, Palo Alto, CA 94304' },
    { id: 18, userId: 2, name: 'Clearwater Ventures', email: 'ap@clearwatervc.example', phoneNumber: '+15550102005', address: '400 Montgomery St, San Francisco, CA 94104' }
  ];

  // Generate 50 invoices for user 1 (clients 1..9, 11..13; client 10 Silverline Bio intentionally has 0 invoices)
  // and 16 invoices for user 2 (clients 14..17; client 18 Clearwater Ventures intentionally has 0 invoices)
  const statuses: InvoiceStatus[] = ['PAID', 'PAID', 'PAID', 'SENT', 'SENT', 'OVERDUE', 'DRAFT', 'CANCELLED'];
  const alexClientIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13];
  const invoices: DemoInvoice[] = [];
  let invId = 1;

  for (let i = 0; i < 50; i++) {
    const monthOffset = Math.floor(i / 6); // April (4) through Dec (12) 2026
    const month = 4 + Math.min(monthOffset, 7);
    const day = 2 + ((i * 5) % 25);
    const issueDate = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dueMonth = day > 14 ? Math.min(12, month + 1) : month;
    const dueDay = day > 14 ? Math.max(1, (day + 15) % 28) : day + 14;
    const dueDate = `2026-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

    let status = statuses[i % statuses.length];
    if (month <= 8 && status === 'SENT') {
      status = 'PAID';
    }
    if (month >= 11 && status === 'OVERDUE') {
      status = 'SENT';
    }

    const baseCents = 125000 + ((i * 73125) % 685000);
    const totalAmount = Math.round(baseCents) / 100;
    const clientId = alexClientIds[i % alexClientIds.length];

    invoices.push({
      id: invId,
      userId: 1,
      clientId,
      invoiceNumber: `INV-2026-${String(invId).padStart(3, '0')}`,
      issueDate,
      dueDate,
      totalAmount,
      status
    });
    invId++;
  }

  const saraClientIds = [14, 15, 16, 17];
  for (let j = 0; j < 16; j++) {
    const month = 6 + Math.floor(j / 3);
    const day = 4 + ((j * 6) % 22);
    const issueDate = `2026-${String(Math.min(11, month)).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dueDate = `2026-${String(Math.min(12, month + 1)).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = statuses[j % statuses.length];
    const totalAmount = Math.round(180000 + ((j * 94550) % 720000)) / 100;

    invoices.push({
      id: invId,
      userId: 2,
      clientId: saraClientIds[j % saraClientIds.length],
      invoiceNumber: `HRB-2026-${String(101 + j)}`,
      issueDate,
      dueDate,
      totalAmount,
      status
    });
    invId++;
  }

  // Portal Accounts:
  // Active & Unblocked: Northwind Studio (1), Crestline Advisory (5), Helios Freight (6), Solstice Retail (14)
  // Active & Blocked: Cobalt Logistics (2), Ironwood Energy (8)
  const portal_accounts: DemoPortalAccount[] = [
    { id: 1, clientId: 1, email: 'billing@northwindstudio.example', password: 'DemoClientPass1!', enabled: true, createdAt: created },
    { id: 2, clientId: 2, email: 'accounts@cobaltlogistics.example', password: 'DemoClientPass1!', enabled: false, createdAt: created },
    { id: 3, clientId: 5, email: 'payables@crestlineadvisory.example', password: 'DemoClientPass1!', enabled: true, createdAt: created },
    { id: 4, clientId: 6, email: 'invoices@heliosfreight.example', password: 'DemoClientPass1!', enabled: true, createdAt: created },
    { id: 5, clientId: 8, email: 'ap@ironwoodenergy.example', password: 'DemoClientPass1!', enabled: false, createdAt: created },
    { id: 6, clientId: 14, email: 'payables@solsticeretail.example', password: 'DemoClientPass1!', enabled: true, createdAt: created }
  ];

  // Invited (unactivated) clients: Verdant Labs (3), Beacon Analytics (7)
  const invitations: DemoInvitation[] = [
    {
      id: 1,
      clientId: 3,
      createdByUserId: 1,
      invitationCode: 'VRD8K2PM',
      createdAt: created,
      expiresAt: plus7Days,
      usedAt: null,
      sentAt: created
    },
    {
      id: 2,
      clientId: 7,
      createdByUserId: 1,
      invitationCode: 'BCN4W9QX',
      createdAt: created,
      expiresAt: plus7Days,
      usedAt: null,
      sentAt: created
    }
  ];

  const demo_inbox: DemoInboxMessage[] = [
    {
      id: 1,
      type: 'INVITATION',
      recipientEmail: 'finance@verdantlabs.example',
      recipientName: 'Verdant Labs',
      subject: 'Invoice Management System client portal invitation',
      body: 'Hello Verdant Labs,\n\nYou have been invited to access your invoices in the client portal.\nUse email finance@verdantlabs.example and invitation code VRD8K2PM.',
      invitationCode: 'VRD8K2PM',
      actionUrl: '/auth?accountType=client',
      read: false,
      createdAt: created
    },
    {
      id: 2,
      type: 'INVITATION',
      recipientEmail: 'finance@beaconanalytics.example',
      recipientName: 'Beacon Analytics',
      subject: 'Invoice Management System client portal invitation',
      body: 'Hello Beacon Analytics,\n\nYou have been invited to access your invoices in the client portal.\nUse email finance@beaconanalytics.example and invitation code BCN4W9QX.',
      invitationCode: 'BCN4W9QX',
      actionUrl: '/auth?accountType=client',
      read: false,
      createdAt: created
    }
  ];

  return { users, clients, invoices, invitations, portal_accounts, demo_inbox };
}
