// ==============================================================================
// Controller: ticketController.js
// Purpose: Customer Support Ticket & Helpdesk System
//          - Retrieve User Support Tickets
//          - Open New Support Ticket (with priority & optional VM tagging)
//          - View Ticket Discussion & Admin Resolution
//          - Close/Resolve Ticket from Customer Portal
// ==============================================================================

import prisma from '../lib/prisma.js';

/**
 * 1. GET /api/tickets
 * Retrieves all tickets submitted by the authenticated customer.
 */
export async function getUserTickets(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'OPEN').length,
      inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
      closed: tickets.filter((t) => t.status === 'CLOSED').length,
    };

    res.json({
      success: true,
      stats,
      tickets,
    });
  } catch (error) {
    console.error('getUserTickets error:', error);
    res.status(500).json({ error: 'Failed to retrieve your support tickets.' });
  }
}

/**
 * 2. POST /api/tickets
 * Submits a new support ticket to the ATEC engineering support queue.
 */
export async function createTicket(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subject, message, priority, vmId } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Please provide a ticket subject line.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Please describe the issue or inquiry.' });
    }

    let finalSubject = subject.trim();
    if (vmId) {
      const vm = await prisma.virtualMachine.findFirst({
        where: { vmId: Number(vmId), userId },
        select: { vmName: true },
      });
      if (vm) {
        finalSubject = `[VM: ${vm.vmName}] ${finalSubject}`;
      }
    }

    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    const assignedPriority = validPriorities.includes(priority?.toUpperCase())
      ? priority.toUpperCase()
      : 'NORMAL';

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: finalSubject,
        message: message.trim(),
        priority: assignedPriority,
        status: 'OPEN',
      },
    });

    // Record in user activity logs
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CREATE_SUPPORT_TICKET',
        status: 'SUCCESS',
        details: `Submitted support ticket #${ticket.id}: "${ticket.subject}" [Priority: ${ticket.priority}]`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. An engineer will inspect your request shortly.',
      ticket,
    });
  } catch (error) {
    console.error('createTicket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket.' });
  }
}

/**
 * 3. GET /api/tickets/:id
 * Fetches single ticket details and resolution status.
 */
export async function getTicketDetails(req, res) {
  try {
    const userId = req.user?.userId;
    const ticketId = Number(req.params.id);

    if (!ticketId) {
      return res.status(400).json({ error: 'Invalid ticket ID.' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found.' });
    }

    // Security check: only ticket owner or admin may view
    const isOwner = ticket.userId === userId;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied to this ticket.' });
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('getTicketDetails error:', error);
    res.status(500).json({ error: 'Failed to retrieve ticket details.' });
  }
}

/**
 * 4. PATCH /api/tickets/:id/close
 * Customer closes their resolved ticket.
 */
export async function closeUserTicket(req, res) {
  try {
    const userId = req.user?.userId;
    const ticketId = Number(req.params.id);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found.' });
    }

    if (ticket.userId !== userId && req.user?.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'Cannot close ticket owned by another user.' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'CLOSED' },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CLOSE_SUPPORT_TICKET',
        status: 'SUCCESS',
        details: `Customer closed support ticket #${ticketId}`,
      },
    });

    res.json({
      success: true,
      message: 'Ticket closed successfully.',
      ticket: updated,
    });
  } catch (error) {
    console.error('closeUserTicket error:', error);
    res.status(500).json({ error: 'Failed to close ticket.' });
  }
}
