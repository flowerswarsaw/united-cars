import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Temporary fix: return basic test data while fixing import issues
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    
    const testTasks = [
      // Contact-Related Tasks
      {
        id: 'task_1',
        title: 'Schedule demo with Marcus Rodriguez',
        description: 'Set up product demonstration for AutoMax luxury dealership integration',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        targetType: 'CONTACT',
        targetId: 'contact_1',
        assigneeId: 'user_sales_1',
        estimatedHours: 2,
        customFields: {
          meeting_type: 'Product Demo',
          preferred_time: '2:00 PM - 4:00 PM',
          location: 'AutoMax Offices',
          attendees: ['Marcus Rodriguez', 'Jennifer Chen']
        },
        createdAt: '2024-09-12T10:00:00Z',
        updatedAt: '2024-09-12T10:00:00Z'
      },
      {
        id: 'task_2',
        title: 'Follow up on Jennifer Chen contract questions',
        description: 'Address pricing and service level questions from sales director',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        targetType: 'CONTACT',
        targetId: 'contact_2',
        assigneeId: 'user_sales_1',
        estimatedHours: 1,
        customFields: {
          questions: ['Volume discounts', 'Premium support SLA', 'Implementation timeline'],
          urgency: 'Deal closing this month'
        },
        createdAt: '2024-09-11T14:30:00Z',
        updatedAt: '2024-09-13T09:15:00Z'
      },
      {
        id: 'task_3',
        title: 'Send welcome package to Robert Thompson',
        description: 'Premier Motors won deal - send onboarding materials',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        targetType: 'CONTACT',
        targetId: 'contact_3',
        assigneeId: 'user_onboarding_1',
        estimatedHours: 0.5,
        customFields: {
          package_contents: ['Welcome Letter', 'API Documentation', 'Training Schedule', 'Support Contacts'],
          delivery_method: 'FedEx Overnight',
          tracking_number: 'FX123456789'
        },
        createdAt: '2024-09-05T16:00:00Z',
        updatedAt: '2024-09-12T11:30:00Z'
      },
      // Deal-Related Tasks
      {
        id: 'task_4',
        title: 'Prepare proposal for Copart Sacramento',
        description: 'Create comprehensive proposal for salvage vehicle processing expansion',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        targetType: 'DEAL',
        targetId: 'deal_4',
        assigneeId: 'user_sales_2',
        estimatedHours: 8,
        customFields: {
          proposal_sections: ['Technical Specifications', 'Pricing Model', 'Implementation Plan', 'ROI Analysis'],
          stakeholders: ['Amanda Foster', 'Operations Team', 'IT Department'],
          deadline_reason: 'Board meeting presentation'
        },
        createdAt: '2024-09-09T09:00:00Z',
        updatedAt: '2024-09-13T15:45:00Z'
      },
      {
        id: 'task_5',
        title: 'Contract review for Express Transport API',
        description: 'Legal review of integration agreement terms and conditions',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        targetType: 'DEAL',
        targetId: 'deal_5',
        assigneeId: 'user_legal_1',
        estimatedHours: 4,
        customFields: {
          review_focus: ['Liability clauses', 'Data usage rights', 'SLA requirements', 'Termination terms'],
          external_counsel: false,
          priority_clauses: ['Data security', 'API uptime guarantees']
        },
        createdAt: '2024-09-10T11:00:00Z',
        updatedAt: '2024-09-10T11:00:00Z'
      },
      {
        id: 'task_6',
        title: 'Requirements gathering for Pacific Shipping Portal',
        description: 'Document detailed requirements for international shipping portal',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        targetType: 'DEAL',
        targetId: 'deal_6',
        assigneeId: 'user_pm_1',
        estimatedHours: 12,
        customFields: {
          requirements_categories: ['Functional', 'Non-functional', 'Integration', 'Security'],
          stakeholder_interviews: ['James Nakamura', 'Port Operations', 'Customs Team'],
          deliverables: ['Requirements Document', 'Use Cases', 'Technical Architecture']
        },
        createdAt: '2024-09-05T14:00:00Z',
        updatedAt: '2024-09-14T10:30:00Z'
      },
      // Organization-Related Tasks
      {
        id: 'task_7',
        title: 'Complete City Cars Direct verification',
        description: 'Verify dealer credentials and financial standing for new client onboarding',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        targetType: 'ORGANISATION',
        targetId: 'org_3',
        assigneeId: 'user_compliance_1',
        estimatedHours: 3,
        customFields: {
          verification_items: ['Dealer License', 'Financial Statements', 'Insurance Coverage', 'References'],
          required_documents: ['W-9', 'Certificate of Insurance', 'Bank Reference Letter'],
          compliance_level: 'Standard Dealer Verification'
        },
        createdAt: '2024-09-11T08:00:00Z',
        updatedAt: '2024-09-11T08:00:00Z'
      },
      {
        id: 'task_8',
        title: 'Update Elite Collectors profile',
        description: 'Update client profile with new collection focus and expansion plans',
        status: 'COMPLETED',
        priority: 'LOW',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        targetType: 'ORGANISATION',
        targetId: 'org_10',
        assigneeId: 'user_account_mgr_1',
        estimatedHours: 1,
        customFields: {
          updates_made: ['Collection expansion to European classics', 'New Arizona facility', 'Increased monthly volume'],
          profile_sections: ['Company Overview', 'Service Preferences', 'Volume Projections']
        },
        createdAt: '2024-09-05T13:00:00Z',
        updatedAt: '2024-09-10T16:20:00Z'
      },
      // Overdue Tasks
      {
        id: 'task_9',
        title: 'Send quarterly report to Johnson Family Auto',
        description: 'Prepare and send Q3 performance and volume report',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (overdue)
        targetType: 'ORGANISATION',
        targetId: 'org_9',
        assigneeId: 'user_account_mgr_2',
        estimatedHours: 2,
        customFields: {
          report_period: 'Q3 2024',
          metrics: ['Transaction Volume', 'Processing Time', 'Cost Savings', 'Customer Satisfaction'],
          format: 'PDF Report with Executive Summary',
          overdue_reason: 'Waiting for final data from processing team'
        },
        createdAt: '2024-09-01T10:00:00Z',
        updatedAt: '2024-09-12T14:00:00Z'
      },
      // High Priority Urgent Tasks
      {
        id: 'task_10',
        title: 'Resolve Manheim integration API issues',
        description: 'Critical bug fix for authentication failures in enterprise integration',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(), // 12 hours from now
        targetType: 'DEAL',
        targetId: 'deal_10',
        assigneeId: 'user_dev_lead_1',
        estimatedHours: 6,
        customFields: {
          issue_type: 'Critical Bug',
          symptoms: ['Authentication timeouts', 'Failed API calls', 'Data sync errors'],
          impact: 'Enterprise client unable to process transactions',
          escalation_level: 'P0 - Critical',
          on_call_engineer: 'user_dev_lead_1'
        },
        createdAt: '2024-09-14T08:00:00Z',
        updatedAt: '2024-09-14T12:30:00Z'
      },
      // Lead-Related Tasks
      {
        id: 'task_11',
        title: 'Qualify automotive parts supplier lead',
        description: 'Initial qualification call with potential parts supplier partner',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
        targetType: 'LEAD',
        targetId: 'lead_1', // Will be defined in leads expansion
        assigneeId: 'user_sales_3',
        estimatedHours: 1,
        customFields: {
          qualification_criteria: ['Annual volume', 'Geographic coverage', 'Quality certifications'],
          lead_source: 'Trade show contact',
          next_steps: 'Discovery call and needs assessment'
        },
        createdAt: '2024-09-13T15:00:00Z',
        updatedAt: '2024-09-13T15:00:00Z'
      },
      // Follow-up and Maintenance Tasks
      {
        id: 'task_12',
        title: 'Monthly check-in with Carlos Vasquez',
        description: 'Regular relationship maintenance call with Express Transport dispatch manager',
        status: 'PENDING',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        targetType: 'CONTACT',
        targetId: 'contact_8',
        assigneeId: 'user_account_mgr_1',
        estimatedHours: 0.5,
        customFields: {
          call_type: 'Relationship Maintenance',
          topics: ['Service satisfaction', 'Volume trends', 'New features interest', 'Expansion opportunities'],
          cadence: 'Monthly',
          last_contact: '2024-08-15'
        },
        createdAt: '2024-09-01T12:00:00Z',
        updatedAt: '2024-09-01T12:00:00Z'
      },
      {
        id: 'task_13',
        title: 'Prepare training materials for Pacific Shipping',
        description: 'Create user training documentation for international portal',
        status: 'PENDING',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
        targetType: 'ORGANISATION',
        targetId: 'org_7',
        assigneeId: 'user_training_1',
        estimatedHours: 8,
        customFields: {
          materials_needed: ['User Guide', 'Video Tutorials', 'Quick Reference Cards', 'API Documentation'],
          languages: ['English', 'Japanese'],
          training_format: 'Blended (Online + In-person)',
          target_audience: ['Operations Staff', 'IT Team', 'Management']
        },
        createdAt: '2024-09-08T11:00:00Z',
        updatedAt: '2024-09-08T11:00:00Z'
      },
      // Data and Analysis Tasks
      {
        id: 'task_14',
        title: 'Analyze AutoMax transaction patterns',
        description: 'Review Q3 transaction data to identify optimization opportunities',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        targetType: 'ORGANISATION',
        targetId: 'org_1',
        assigneeId: 'user_analyst_1',
        estimatedHours: 4,
        customFields: {
          analysis_type: 'Transaction Pattern Analysis',
          data_period: 'Q3 2024',
          focus_areas: ['Peak usage times', 'Transaction types', 'Processing efficiency', 'Error rates'],
          deliverable: 'Optimization Recommendations Report'
        },
        createdAt: '2024-09-12T09:00:00Z',
        updatedAt: '2024-09-14T14:15:00Z'
      },
      // Compliance and Administrative Tasks
      {
        id: 'task_15',
        title: 'Renew Copart service agreement',
        description: 'Process annual renewal for Sacramento facility service agreement',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        targetType: 'ORGANISATION',
        targetId: 'org_4',
        assigneeId: 'user_contracts_1',
        estimatedHours: 2,
        customFields: {
          renewal_type: 'Annual Agreement',
          contract_value: 3200000,
          changes: ['Volume tier adjustments', 'New SLA terms', 'Expanded service hours'],
          effective_date: '2024-10-01',
          signed_date: '2024-09-09'
        },
        createdAt: '2024-08-15T10:00:00Z',
        updatedAt: '2024-09-09T16:30:00Z'
      }
    ];
    
    let filteredTasks = testTasks;
    
    // Apply basic filtering
    if (targetType && targetId) {
      filteredTasks = filteredTasks.filter(task => 
        task.targetType === targetType && task.targetId === targetId
      );
    }
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (assigneeId) {
      filteredTasks = filteredTasks.filter(task => task.assigneeId === assigneeId);
    }
    
    return NextResponse.json(filteredTasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Temporary fix: return created task data
    const newTask = {
      id: 'task_new',
      ...body,
      status: body.status || 'PENDING',
      priority: body.priority || 'MEDIUM',
      customFields: body.customFields || {},
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}