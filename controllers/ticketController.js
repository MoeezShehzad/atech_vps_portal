// ==============================================================================
// Controller: ticketController.js
// Purpose: Customer Support Ticket & Helpdesk System
//          - Real-Time Multi-Turn Chat & Conversation History
//          - Open New Support Ticket (with priority & optional VM tagging)
//          - Post Follow-up Messages to Ongoing Thread
//          - Close/Resolve Ticket from Customer Portal
// ==============================================================================

import prisma from '../lib/prisma.js';
import { sendTicketCreatedNotification, sendTicketReplyNotification } from '../services/emailService.js';
import { calculateTicketMetrics } from '../services/ticketAutomationService.js';

export function parseChatHistory(ticket, user = null) {
  let list = [];
  if (ticket.chatHistory) {
    try {
      list = JSON.parse(ticket.chatHistory);
    } catch (_) {}
  }
  if (!Array.isArray(list) || list.length === 0) {
    if (ticket.message) {
      list.push({
        id: 'msg-init',
        sender: 'CUSTOMER',
        senderName: user?.fullName || 'Customer',
        message: ticket.message,
        timestamp: ticket.createdAt,
      });
    }
    if (ticket.response) {
      list.push({
        id: 'msg-resp',
        sender: 'SUPPORT',
        senderName: ticket.assignedTo || 'Support Engineer',
        message: ticket.response,
        timestamp: ticket.updatedAt || ticket.createdAt,
      });
    }
  }
  return list;
}

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

    const parsedTickets = tickets.map((t) =>
      calculateTicketMetrics({
        ...t,
        chatHistory: parseChatHistory(t, req.user),
      })
    );

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'OPEN').length,
      awaitingAction: tickets.filter((t) => t.status === 'AWAITING_USER_ACTION').length,
      inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
      closed: tickets.filter((t) => t.status === 'CLOSED' || t.status === 'CLOSED_TIMEOUT').length,
    };

    res.json({
      success: true,
      stats,
      tickets: parsedTickets,
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

    const initialThread = [
      {
        id: `msg-${Date.now()}`,
        sender: 'CUSTOMER',
        senderName: req.user?.fullName || req.user?.email || 'Customer',
        message: message.trim(),
        timestamp: new Date().toISOString(),
      },
    ];

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: finalSubject,
        message: message.trim(),
        priority: assignedPriority,
        status: 'OPEN',
        assignedTo: process.env.SUPPORT_EMAIL || 'customer-support@atechconsult.com',
        chatHistory: JSON.stringify(initialThread),
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

    // Asynchronously dispatch email notification to support team and confirmation receipt to customer
    sendTicketCreatedNotification({
      ticket,
      customerEmail: req.user?.email,
      customerName: req.user?.fullName,
    }).catch((err) => console.warn('[Ticket Creation Email Warning]:', err.message));

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. An engineer will inspect your request shortly.',
      ticket: {
        ...ticket,
        chatHistory: initialThread,
      },
    });
  } catch (error) {
    console.error('createTicket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket.' });
  }
}

/**
 * 3. POST /api/tickets/:id/message
 * Adds a new message from the customer into the ticket discussion thread.
 */
export async function addCustomerMessage(req, res) {
  try {
    const userId = req.user?.userId;
    const ticketId = Number(req.params.id);
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found.' });
    }

    const isOwner = ticket.userId === userId;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied to this ticket.' });
    }

    // --------------------------------------------------------------------------
    // SMART REOPEN & LINKING POLICY:
    // If ticket is CLOSED_TIMEOUT (or CLOSED past SLA timeout):
    // Block reopening original ticket. Spin up a new linked Follow-up ticket.
    // --------------------------------------------------------------------------
    if (ticket.status === 'CLOSED_TIMEOUT') {
      const followUpSubject = ticket.subject.startsWith('[Follow-up')
        ? ticket.subject
        : `[Follow-up to #${ticket.id}] ${ticket.subject}`;

      const followUpThread = [
        {
          id: `msg-${Date.now()}`,
          sender: 'CUSTOMER',
          senderName: req.user?.fullName || req.user?.email || 'Customer',
          message: message.trim(),
          timestamp: new Date().toISOString(),
        },
      ];

      const newFollowUpTicket = await prisma.supportTicket.create({
        data: {
          userId: ticket.userId,
          parentTicketId: ticket.id,
          isFollowUp: true,
          subject: followUpSubject,
          message: message.trim(),
          priority: ticket.priority,
          status: 'OPEN',
          assignedTo: ticket.assignedTo || process.env.SUPPORT_EMAIL || 'customer-support@atechconsult.com',
          chatHistory: JSON.stringify(followUpThread),
          lastAutomatedAction: `Follow-up spawned referencing parent Ticket #${ticket.id}`,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: ticket.userId,
          action: 'CREATE_FOLLOW_UP_TICKET',
          status: 'SUCCESS',
          details: `Automatically generated Follow-up ticket #${newFollowUpTicket.id} linked to closed parent #${ticket.id}`,
        },
      });

      sendTicketCreatedNotification({
        ticket: newFollowUpTicket,
        customerEmail: req.user?.email,
        customerName: req.user?.fullName,
      }).catch((err) => console.warn('[Follow-up creation email error]:', err.message));

      return res.json({
        success: true,
        isFollowUpCreated: true,
        message: `Original ticket #${ticket.id} was closed due to timeout. A new linked Follow-up ticket (#${newFollowUpTicket.id}) has been created for your inquiry.`,
        ticket: calculateTicketMetrics({
          ...newFollowUpTicket,
          chatHistory: followUpThread,
        }),
      });
    }

    // Standard message appending for active or awaiting tickets
    const thread = parseChatHistory(ticket, req.user);
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'CUSTOMER',
      senderName: req.user?.fullName || req.user?.email || 'Customer',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };
    thread.push(newMsg);

    // If customer responds while "Awaiting User Action", revert status to "OPEN" and reset countdown clock
    let newStatus = ticket.status;
    let awaitingSinceUpdate = ticket.awaitingActionSince;
    let reminderLevelUpdate = ticket.reminderLevel;
    let lastAutomatedActionUpdate = ticket.lastAutomatedAction;

    if (ticket.status === 'AWAITING_USER_ACTION') {
      newStatus = 'OPEN';
      awaitingSinceUpdate = null;
      reminderLevelUpdate = 0;
      lastAutomatedActionUpdate = 'Customer responded: SLA timer reset, status reverted to Open';
    } else if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      newStatus = 'REOPENED';
      lastAutomatedActionUpdate = 'Customer replied: Ticket reopened';
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        chatHistory: JSON.stringify(thread),
        status: newStatus,
        awaitingActionSince: awaitingSinceUpdate,
        reminderLevel: reminderLevelUpdate,
        lastAutomatedAction: lastAutomatedActionUpdate,
      },
    });

    // Notify customer support team of customer's follow-up message
    sendTicketReplyNotification({
      ticket: updated,
      senderName: req.user?.fullName || req.user?.email || 'Customer',
      message: message.trim(),
      recipientEmail: process.env.SUPPORT_EMAIL || 'customer-support@atechconsult.com',
      isCustomerRecipient: false,
    }).catch((err) => console.warn('[Customer Ticket Reply Email Warning]:', err.message));

    res.json({
      success: true,
      ticket: calculateTicketMetrics({
        ...updated,
        chatHistory: thread,
      }),
      newMessage: newMsg,
    });
  } catch (error) {
    console.error('addCustomerMessage error:', error);
    res.status(500).json({ error: 'Failed to add message to ticket thread.' });
  }
}

/**
 * 4. GET /api/tickets/:id
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

    const isOwner = ticket.userId === userId;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied to this ticket.' });
    }

    res.json({
      success: true,
      ticket: calculateTicketMetrics({
        ...ticket,
        chatHistory: parseChatHistory(ticket, req.user),
      }),
    });
  } catch (error) {
    console.error('getTicketDetails error:', error);
    res.status(500).json({ error: 'Failed to retrieve ticket details.' });
  }
}

/**
 * 5. PATCH /api/tickets/:id/close
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
      ticket: {
        ...updated,
        chatHistory: parseChatHistory(updated, req.user),
      },
    });
  } catch (error) {
    console.error('closeUserTicket error:', error);
    res.status(500).json({ error: 'Failed to close ticket.' });
  }
}
