// NIST SP 800-53 Controls Catalog
// This file contains a reference catalog of security controls based on NIST SP 800-53 Rev 5

export interface ControlCatalogItem {
  id: string;
  family: string;
  title: string;
  description: string;
  priority?: string;
  baseline?: string[];
  related?: string[];
  importance?: string; // Why this control matters
  mitigationSuggestions?: string[]; // Suggestions for implementing the control
}

export type ControlsCatalog = Record<string, Record<string, ControlCatalogItem>>;

/**
 * Baseline Impact Levels Explanation:
 * 
 * LOW - Controls applicable to systems where the loss of confidentiality, integrity, or availability 
 *       would have a limited adverse effect on organizational operations, assets, or individuals.
 * 
 * MODERATE - Controls applicable to systems where the loss would have a serious adverse effect.
 * 
 * HIGH - Controls applicable to systems where the loss would have a severe or catastrophic adverse effect.
 * 
 * The baseline indicates which controls are required based on the system's security categorization
 * according to FIPS 199 and NIST SP 800-60.
 */

// This is a simplified sample of NIST SP 800-53 controls
// In a production environment, this would ideally be fetched from an API or database
const controlsCatalog: ControlsCatalog = 
{
    "AC": {
      "AC-1": {
        "id": "AC-1",
        "family": "AC",
        "title": "Policy and Procedures",
        "description": "Establish and maintain access control policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Access control policies provide the foundation for an organization's entire access management approach, ensuring consistent enforcement and accountability.",
        "mitigationSuggestions": [
          "Develop documented access control policies that align with organizational risk management strategy",
          "Review and update policies at least annually",
          "Designate specific roles responsible for access control policy enforcement",
          "Ensure policies address all system components and access methods"
        ]
      },
      "AC-2": {
        "id": "AC-2",
        "family": "AC",
        "title": "Account Management",
        "description": "Establish, maintain, and document account creation, modification, enabling, disabling, and removal procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-3", "AC-4", "AC-5", "AC-6", "AC-17", "AC-19", "AC-20", "IA-2", "IA-4", "IA-5", "IA-8", "MA-3", "MA-4", "MA-5", "PL-4", "SC-13"],
        "importance": "Account management ensures that only authorized users have access to systems and that their access is appropriate for their roles and responsibilities.",
        "mitigationSuggestions": [
          "Implement automated account management systems",
          "Establish role-based access control",
          "Conduct regular account reviews and audits",
          "Implement a formal access request and approval process", 
          "Automate account deactivation when employees leave the organization"
        ]
      },
      "AC-3": {
        "id": "AC-3",
        "family": "AC",
        "title": "Access Enforcement",
        "description": "Enforce approved authorizations for logical access to information and system resources.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-2", "AC-4", "AC-5", "AC-6", "AC-16", "AC-17", "AC-18", "AC-19", "AC-20", "AC-24", "IA-2", "IA-7", "SC-13"],
        "importance": "Access enforcement is the technical implementation of access policies, ensuring that policies are consistently enforced through technical means.",
        "mitigationSuggestions": [
          "Implement technical access control mechanisms like RBAC, ABAC, or MAC",
          "Use multi-factor authentication for sensitive systems", 
          "Deploy access control lists (ACLs) on network devices",
          "Implement least privilege access principles",
          "Use application-level access controls in addition to OS controls"
        ]
      },
      "AC-4": {
        "id": "AC-4",
        "family": "AC",
        "title": "Information Flow Enforcement",
        "description": "Enforce approved authorizations for controlling the flow of information within the system and between connected systems.",
        "priority": "P1",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["AC-3", "AC-17", "AC-19", "AC-25", "AU-6", "CA-7", "CM-2", "CM-6", "CM-7", "SA-8", "SC-2", "SC-5", "SC-7", "SC-8"],
        "importance": "Information flow controls prevent sensitive data from moving in unauthorized ways between systems or network segments, reducing data exfiltration risks.",
        "mitigationSuggestions": [
          "Implement firewalls and network segmentation", 
          "Deploy data loss prevention (DLP) solutions",
          "Use content-filtering proxies",
          "Implement traffic flow policies",
          "Deploy encrypted channels for sensitive data transfers"
        ]
      }
    },
    "AT": {
      "AT-1": {
        "id": "AT-1",
        "family": "AT",
        "title": "Policy and Procedures",
        "description": "Establish and maintain security awareness and training policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Awareness and training policies ensure consistent implementation of security education programs across the organization, establishing expectations for all personnel.",
        "mitigationSuggestions": [
          "Develop formal security awareness and training policy documents",
          "Ensure policies address different roles and responsibilities",
          "Review and update training policies annually",
          "Define measurable objectives for the training program",
          "Establish procedures for tracking training completion"
        ]
      },
      "AT-2": {
        "id": "AT-2",
        "family": "AT",
        "title": "Awareness Training",
        "description": "Provide basic security awareness training to system users as part of initial training and when required by system changes.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-3", "AC-17", "AC-22", "AT-3", "AT-4", "CP-3", "IR-2", "IR-8", "PL-4", "PS-7"],
        "importance": "Security awareness training ensures all personnel understand their security responsibilities, recognize threats, and know how to protect organizational resources.",
        "mitigationSuggestions": [
          "Implement regular security awareness training for all staff",
          "Include practical examples of security threats in training materials",
          "Use multiple delivery methods (videos, quizzes, simulations)",
          "Conduct phishing simulations to test effectiveness",
          "Update training content to address emerging threats"
        ]
      },
      "AT-3": {
        "id": "AT-3",
        "family": "AT",
        "title": "Role-Based Training",
        "description": "Provide role-based security training to personnel with assigned security roles and responsibilities.",
        "priority": "P1",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["AT-2", "AT-4", "PL-4", "PS-7", "SA-3", "SA-12", "SA-16"],
        "importance": "Role-based training ensures personnel with specialized security responsibilities have the knowledge needed to perform their specific security functions effectively.",
        "mitigationSuggestions": [
          "Develop specialized training for security administrators",
          "Provide dedicated training for incident response team members",
          "Create specific content for personnel with data privacy responsibilities",
          "Include hands-on exercises for technical security roles",
          "Ensure training addresses specific technologies used by the organization"
        ]
      },
      "AT-4": {
        "id": "AT-4",
        "family": "AT",
        "title": "Training Records",
        "description": "Document and monitor individual information system security training activities and retain records.",
        "priority": "P3",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AT-2", "AT-3", "PM-14"],
        "importance": "Training records provide evidence of compliance and help identify personnel who require additional or refresher training to maintain security awareness.",
        "mitigationSuggestions": [
          "Implement a learning management system for tracking training completion",
          "Establish a process for recording and reporting on training metrics",
          "Maintain records of all security training attendance and test results",
          "Set up automated reminders for training renewal requirements",
          "Develop dashboards to visualize training compliance status"
        ]
      }
    },
    "AU": {
      "AU-1": {
        "id": "AU-1",
        "family": "AU",
        "title": "Policy and Procedures",
        "description": "Establish and maintain audit and accountability policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Audit policies establish the foundation for accountability by defining what events to capture, how long to retain audit data, and how to review and analyze it.",
        "mitigationSuggestions": [
          "Develop comprehensive audit policies that specify events to be logged",
          "Define retention periods for different types of audit data",
          "Establish procedures for regular audit log review",
          "Define roles responsible for audit functions",
          "Ensure policies address protection of audit information"
        ]
      },
      "AU-2": {
        "id": "AU-2",
        "family": "AU",
        "title": "Audit Events",
        "description": "Determine the types of events that the system is capable of logging in support of the audit function.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-6", "AC-17", "AU-3", "AU-12", "MA-4", "MP-4", "RA-3", "SC-7", "SI-4"],
        "importance": "Identifying auditable events ensures the organization captures necessary data to detect, investigate, and respond to security incidents effectively.",
        "mitigationSuggestions": [
          "Document a comprehensive list of auditable events across systems",
          "Include authentication events, privilege changes, and system changes",
          "Configure audit parameters based on system security categorization",
          "Review and update the list of auditable events periodically",
          "Include both successful and failed security-relevant activities"
        ]
      },
      "AU-3": {
        "id": "AU-3",
        "family": "AU",
        "title": "Content of Audit Records",
        "description": "Ensure that audit records contain information needed to establish what events occurred, the sources of the events, and the outcomes of the events.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AU-2", "AU-8", "AU-12", "SI-4"],
        "importance": "Detailed audit records provide the context needed to understand security events, establish baselines, and investigate potential incidents effectively.",
        "mitigationSuggestions": [
          "Configure audit logs to capture user identities, timestamps, and event types",
          "Include source and destination addresses in network event logs",
          "Record success/failure indicators for all security events",
          "Ensure system object names and identifiers are included in logs",
          "Standardize log formats across systems where possible"
        ]
      },
      "AU-4": {
        "id": "AU-4",
        "family": "AU",
        "title": "Audit Storage Capacity",
        "description": "Allocate audit record storage capacity in accordance with organization-defined requirements.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AU-5", "AU-9", "AU-11", "SC-28", "SI-4"],
        "importance": "Adequate audit storage ensures logs are retained for required periods and prevents loss of audit data that could hamper security monitoring and incident response.",
        "mitigationSuggestions": [
          "Calculate storage requirements based on log volume and retention requirements",
          "Implement log rotation and archiving procedures",
          "Monitor storage capacity and set up alerts for capacity thresholds",
          "Consider using dedicated log storage infrastructure",
          "Implement log compression to optimize storage usage"
        ]
      }
    },
    "CA": {
      "CA-1": {
        "id": "CA-1",
        "family": "CA",
        "title": "Policy and Procedures",
        "description": "Establish and maintain assessment, authorization, and monitoring policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Assessment policies establish the foundation for evaluating security controls, authorizing systems, and conducting ongoing monitoring of the security posture.",
        "mitigationSuggestions": [
          "Develop formal security assessment and authorization policies",
          "Establish procedures for conducting control assessments",
          "Define ongoing monitoring requirements and frequencies",
          "Document roles responsible for assessment and authorization activities",
          "Review and update assessment procedures annually"
        ]
      },
      "CA-2": {
        "id": "CA-2",
        "family": "CA",
        "title": "Control Assessments",
        "description": "Develop security and privacy assessment plans, and assess controls to determine implementation and effectiveness.",
        "priority": "P2",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["CA-5", "CA-6", "CA-7", "PM-9", "RA-5", "SA-11", "SI-4"],
        "importance": "Regular control assessments verify that security controls are implemented correctly, operating as intended, and producing the desired outcomes.",
        "mitigationSuggestions": [
          "Develop comprehensive assessment plans for all systems",
          "Use a mix of assessment methods (examine, interview, test)",
          "Ensure assessors have appropriate independence",
          "Document assessment findings and evidence",
          "Create a schedule for regular control assessments"
        ]
      },
      "CA-3": {
        "id": "CA-3",
        "family": "CA",
        "title": "Information Exchange",
        "description": "Analyze risks associated with information exchange and establish agreements for information exchange between systems.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-4", "AC-20", "AU-16", "PL-2", "SA-9", "SC-7", "SI-12"],
        "importance": "Information exchange controls ensure that security risks are identified and mitigated when connecting systems or sharing data between organizations.",
        "mitigationSuggestions": [
          "Develop and implement system interconnection agreements",
          "Conduct security assessments before authorizing connections",
          "Document security requirements for data exchanges",
          "Implement technical security controls at connection points",
          "Regularly review and update interconnection agreements"
        ]
      },
      "CA-4": {
        "id": "CA-4",
        "family": "CA",
        "title": "Plan of Action and Milestones",
        "description": "Develop and update a plan of action and milestones to document planned remedial actions for security and privacy risks.",
        "priority": "P3",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["CA-2", "CA-5", "CA-7", "PM-4"],
        "importance": "POA&Ms document and track identified weaknesses, helping organizations prioritize and systematically address security deficiencies.",
        "mitigationSuggestions": [
          "Document all identified security weaknesses in the POA&M",
          "Assign responsibility for each remediation action",
          "Establish realistic timelines for addressing vulnerabilities",
          "Update POA&Ms regularly based on assessment findings",
          "Track and report on POA&M progress to leadership"
        ]
      }
    },
    "CM": {
      "CM-1": {
        "id": "CM-1",
        "family": "CM",
        "title": "Policy and Procedures",
        "description": "Establish and maintain configuration management policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Configuration management policies establish the framework for maintaining secure system configurations and managing changes to reduce security risks.",
        "mitigationSuggestions": [
          "Develop comprehensive configuration management policies",
          "Define processes for identifying and managing configuration items",
          "Establish change control procedures and approval workflows",
          "Document configuration baseline requirements",
          "Define roles responsible for configuration management"
        ]
      },
      "CM-2": {
        "id": "CM-2",
        "family": "CM",
        "title": "Baseline Configuration",
        "description": "Develop, document, and maintain baseline configurations of the system.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["CM-3", "CM-5", "CM-6", "CM-8", "SA-10", "SA-15", "SC-18"],
        "importance": "Baseline configurations provide a known secure state that can be used to restore systems and detect unauthorized changes to system components.",
        "mitigationSuggestions": [
          "Develop and document secure baseline configurations for all systems",
          "Use standard security configuration checklists (DISA STIGs, CIS benchmarks)",
          "Maintain baseline configuration documentation",
          "Update baselines when new vulnerabilities are discovered",
          "Automate baseline compliance checking where possible"
        ]
      },
      "CM-3": {
        "id": "CM-3",
        "family": "CM",
        "title": "Configuration Change Control",
        "description": "Document and control changes to the system and its environment of operation.",
        "priority": "P1",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["CA-7", "CM-2", "CM-4", "CM-5", "CM-6", "CM-9", "SA-10", "SI-2", "SI-12"],
        "importance": "Configuration change control ensures that changes are properly tested, approved, and documented to prevent security issues introduced by changes.",
        "mitigationSuggestions": [
          "Implement a formal change management process",
          "Require security impact analysis for all changes",
          "Establish a change control board for significant changes",
          "Test changes in a non-production environment before implementation",
          "Document all changes with rollback procedures"
        ]
      },
      "CM-4": {
        "id": "CM-4",
        "family": "CM",
        "title": "Security Impact Analysis",
        "description": "Analyze changes to the system to determine potential security impacts prior to change implementation.",
        "priority": "P2",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["CA-2", "CA-7", "CM-3", "CM-9", "RA-5", "SA-8", "SA-10", "SI-2"],
        "importance": "Security impact analysis identifies potential security implications of changes before they're implemented, reducing the risk of security vulnerabilities.",
        "mitigationSuggestions": [
          "Establish a formal security impact analysis process",
          "Use security requirements checklist for evaluating changes",
          "Involve security specialists in the change review process",
          "Conduct vulnerability scans after significant changes",
          "Document security considerations for all system changes"
        ]
      }
    },
    "CP": {
      "CP-1": {
        "id": "CP-1",
        "family": "CP",
        "title": "Policy and Procedures",
        "description": "Establish and maintain contingency planning policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Contingency planning policies establish the foundation for preparing for, responding to, and recovering from disruptive events that impact system operations.",
        "mitigationSuggestions": [
          "Develop comprehensive contingency planning policies",
          "Define roles and responsibilities for contingency activities",
          "Establish procedures for developing contingency plans",
          "Document requirements for testing and exercises",
          "Review and update contingency policies annually"
        ]
      },
      "CP-2": {
        "id": "CP-2",
        "family": "CP",
        "title": "Contingency Plan",
        "description": "Develop a contingency plan for the system that identifies essential mission and business functions.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["CP-3", "CP-4", "CP-6", "CP-7", "CP-8", "CP-9", "CP-10", "IR-4", "IR-8", "MP-2", "MP-4", "MP-5", "PM-8", "PM-11"],
        "importance": "Contingency plans provide procedures for continuing critical business operations during disruptions and guide the recovery of systems to normal operations.",
        "mitigationSuggestions": [
          "Develop detailed contingency plans for all critical systems",
          "Identify recovery objectives and priorities",
          "Document specific recovery procedures",
          "Establish notification and activation procedures",
          "Include scenarios for various types of disruptions"
        ]
      },
      "CP-3": {
        "id": "CP-3",
        "family": "CP",
        "title": "Contingency Training",
        "description": "Provide contingency training to system users consistent with assigned roles and responsibilities.",
        "priority": "P2",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["AT-2", "AT-3", "AT-4", "CP-2", "CP-4", "CP-8", "IR-2", "IR-4", "IR-9"],
        "importance": "Contingency training ensures personnel understand their roles and can execute recovery procedures effectively during actual contingency situations.",
        "mitigationSuggestions": [
          "Develop role-specific contingency training materials",
          "Conduct regular training sessions for contingency team members",
          "Include tabletop exercises as part of training",
          "Document participation in contingency training",
          "Update training based on lessons learned from exercises"
        ]
      },
      "CP-4": {
        "id": "CP-4",
        "family": "CP",
        "title": "Contingency Plan Testing",
        "description": "Test the contingency plan for the system to determine its effectiveness and the organizational readiness.",
        "priority": "P2",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["CP-2", "CP-3", "IR-3", "PM-14"],
        "importance": "Regular contingency plan testing validates recovery procedures, identifies weaknesses, and improves organizational readiness for actual disruptions.",
        "mitigationSuggestions": [
          "Conduct regular contingency plan tests and exercises",
          "Use various test methods (tabletop, functional, full-scale)",
          "Document and review test results",
          "Update contingency plans based on test findings",
          "Involve all relevant stakeholders in testing activities"
        ]
      }
    },
    "IA": {
      "IA-1": {
        "id": "IA-1",
        "family": "IA",
        "title": "Policy and Procedures",
        "description": "Establish and maintain identification and authentication policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Identification and authentication policies establish the foundation for verifying the identities of users, devices, and processes before granting access to systems.",
        "mitigationSuggestions": [
          "Develop comprehensive identification and authentication policies",
          "Define identity verification requirements for different access types",
          "Establish password complexity and management guidelines",
          "Document procedures for provisioning and managing identities",
          "Review and update policies annually"
        ]
      },
      "IA-2": {
        "id": "IA-2",
        "family": "IA",
        "title": "Identification and Authentication (Organizational Users)",
        "description": "Uniquely identify and authenticate organizational users and associate that identity with processes acting on behalf of those users.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-2", "AC-3", "AC-4", "AC-14", "AC-17", "AC-18", "IA-4", "IA-5", "IA-8"],
        "importance": "Unique identification of users establishes accountability and provides the foundation for access control, monitoring, and auditing of user activities.",
        "mitigationSuggestions": [
          "Implement multi-factor authentication for all users",
          "Use unique identifiers for each user account",
          "Disable shared/group accounts where possible",
          "Implement stronger authentication for privileged accounts",
          "Use certificate-based authentication for sensitive systems"
        ]
      },
      "IA-3": {
        "id": "IA-3",
        "family": "IA",
        "title": "Device Identification and Authentication",
        "description": "Uniquely identify and authenticate devices before establishing a network connection.",
        "priority": "P1",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["AC-17", "AC-18", "AC-19", "CA-3", "CA-9", "IA-4", "IA-5", "IA-9", "IA-11", "SI-4"],
        "importance": "Device authentication ensures that only authorized devices can connect to the network, reducing the risk of unauthorized access and rogue devices.",
        "mitigationSuggestions": [
          "Implement 802.1x for network access control",
          "Use device certificates for strong authentication",
          "Deploy network access control solutions",
          "Maintain an inventory of authorized devices",
          "Use MAC address filtering as a supplementary control"
        ]
      },
      "IA-4": {
        "id": "IA-4",
        "family": "IA",
        "title": "Identifier Management",
        "description": "Manage information system identifiers for users and devices.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-2", "IA-2", "IA-3", "IA-5", "IA-8", "IA-9", "SC-37"],
        "importance": "Effective identifier management ensures identities are properly created, maintained, and deactivated throughout their lifecycle to prevent unauthorized access.",
        "mitigationSuggestions": [
          "Implement a formal process for issuing and revoking identifiers",
          "Disable inactive accounts after a defined period",
          "Prohibit reuse of identifiers for a defined period",
          "Verify user identity before issuing credentials",
          "Integrate identifier management with HR processes"
        ]
      }
    },
    "IR": {
      "IR-1": {
        "id": "IR-1",
        "family": "IR",
        "title": "Policy and Procedures",
        "description": "Establish and maintain incident response policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Incident response policies establish the foundation for detecting, reporting, and responding to security incidents in a coordinated and effective manner.",
        "mitigationSuggestions": [
          "Develop comprehensive incident response policies",
          "Define incident categories and prioritization criteria",
          "Establish procedures for incident detection and reporting",
          "Define roles and responsibilities for incident handling",
          "Review and update policies annually"
        ]
      },
      "IR-2": {
        "id": "IR-2",
        "family": "IR",
        "title": "Incident Response Training",
        "description": "Provide incident response training to system users consistent with assigned roles and responsibilities.",
        "priority": "P2",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AT-2", "AT-3", "AT-4", "CP-3", "IR-3", "IR-4", "IR-8"],
        "importance": "Incident response training ensures that personnel know how to recognize and report incidents, and team members can effectively respond to security events.",
        "mitigationSuggestions": [
          "Develop role-specific incident response training",
          "Conduct regular training sessions for IR team members",
          "Include simulated incidents in training exercises",
          "Train all employees on incident reporting procedures",
          "Update training based on emerging threat trends"
        ]
      },
      "IR-3": {
        "id": "IR-3",
        "family": "IR",
        "title": "Incident Response Testing",
        "description": "Test the incident response capability for the system using defined tests.",
        "priority": "P2",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["CP-4", "IR-2", "IR-4", "IR-8", "PM-14"],
        "importance": "Regular testing of incident response procedures validates response capabilities, identifies gaps, and improves the organization's ability to respond effectively.",
        "mitigationSuggestions": [
          "Conduct regular tabletop exercises for incident scenarios",
          "Perform simulated incident drills",
          "Test coordination with external entities",
          "Document lessons learned from tests",
          "Update incident response procedures based on test results"
        ]
      },
      "IR-4": {
        "id": "IR-4",
        "family": "IR",
        "title": "Incident Handling",
        "description": "Implement an incident handling capability for security incidents that includes preparation, detection, analysis, containment, eradication, and recovery.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AU-6", "CM-6", "CP-2", "CP-4", "IR-2", "IR-3", "IR-8", "PE-6", "SC-5", "SC-7", "SI-3", "SI-4", "SI-7"],
        "importance": "Effective incident handling procedures enable organizations to respond quickly to security incidents, minimize damage, and restore normal operations.",
        "mitigationSuggestions": [
          "Establish a formal incident response team with defined roles",
          "Develop detailed procedures for each phase of incident handling",
          "Implement automated tools for incident detection and analysis",
          "Establish communication protocols for incident response",
          "Create templates for documenting incident details"
        ]
      }
    },
    "MA": {
      "MA-1": {
        "id": "MA-1",
        "family": "MA",
        "title": "Policy and Procedures",
        "description": "Establish and maintain system maintenance policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Maintenance policies ensure that system components are properly serviced to prevent failures and vulnerabilities that could impact system security.",
        "mitigationSuggestions": [
          "Develop comprehensive system maintenance policies",
          "Define procedures for routine and preventive maintenance",
          "Establish controls for maintenance tools and personnel",
          "Document approval requirements for maintenance activities",
          "Review and update policies annually"
        ]
      },
      "MA-2": {
        "id": "MA-2",
        "family": "MA",
        "title": "Controlled Maintenance",
        "description": "Schedule, document, and review records of maintenance and repairs on system components.",
        "priority": "P2",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["CM-3", "CM-4", "MA-4", "MP-6", "PE-16", "SA-12", "SI-2"],
        "importance": "Controlled maintenance ensures that changes made during maintenance are properly documented and don't introduce security vulnerabilities.",
        "mitigationSuggestions": [
          "Implement a formal maintenance management process",
          "Document all maintenance activities and approvals",
          "Verify system security settings after maintenance",
          "Conduct maintenance during scheduled downtime when possible",
          "Supervise maintenance activities by unauthorized personnel"
        ]
      },
      "MA-3": {
        "id": "MA-3",
        "family": "MA",
        "title": "Maintenance Tools",
        "description": "Control and monitor the use of system maintenance tools.",
        "priority": "P3",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["MA-2", "MA-5", "PE-16"],
        "importance": "Maintenance tools can be used to bypass system security mechanisms, making control of these tools essential to prevent unauthorized system access or modifications.",
        "mitigationSuggestions": [
          "Approve and inventory all maintenance tools",
          "Inspect maintenance tools for improper modifications",
          "Check media containing diagnostics for malicious code",
          "Control physical access to maintenance equipment",
          "Use application allowlisting to prevent unauthorized tool use"
        ]
      },
      "MA-4": {
        "id": "MA-4",
        "family": "MA",
        "title": "Nonlocal Maintenance",
        "description": "Control nonlocal maintenance and diagnostic activities on the system.",
        "priority": "P2",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-2", "AC-3", "AC-6", "AC-17", "MA-2", "MA-5", "SC-7"],
        "importance": "Remote maintenance introduces additional security risks that must be controlled to prevent unauthorized access or malicious activity during maintenance sessions.",
        "mitigationSuggestions": [
          "Use encrypted remote maintenance connections",
          "Authenticate all remote maintenance providers",
          "Document and audit all remote maintenance activities",
          "Terminate sessions and network connections when complete",
          "Implement strong authorization for remote maintenance"
        ]
      }
    },
    "MP": {
      "MP-1": {
        "id": "MP-1",
        "family": "MP",
        "title": "Policy and Procedures",
        "description": "Establish and maintain media protection policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Media protection policies establish requirements for handling, storing, and disposing of media containing sensitive information to prevent unauthorized disclosure.",
        "mitigationSuggestions": [
          "Develop comprehensive media protection policies",
          "Define procedures for media handling and storage",
          "Establish media sanitization requirements",
          "Document media access restrictions",
          "Review and update policies annually"
        ]
      },
      "MP-2": {
        "id": "MP-2",
        "family": "MP",
        "title": "Media Access",
        "description": "Restrict access to digital and non-digital media to authorized individuals.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AC-19", "CP-2", "MP-4", "PE-2", "PE-3"],
        "importance": "Controlling access to media prevents unauthorized disclosure, modification, or destruction of sensitive information stored on these media.",
        "mitigationSuggestions": [
          "Implement physical controls for media storage areas",
          "Use locked cabinets or safes for sensitive media",
          "Maintain logs of media access",
          "Implement role-based access restrictions",
          "Use media library management systems"
        ]
      },
      "MP-3": {
        "id": "MP-3",
        "family": "MP",
        "title": "Media Marking",
        "description": "Mark system media indicating the distribution limitations, handling caveats, and applicable security markings.",
        "priority": "P2",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["CP-9", "MP-4", "MP-5", "RA-3"],
        "importance": "Media marking ensures that users understand the sensitivity of information contained on media and handle it accordingly to prevent data breaches.",
        "mitigationSuggestions": [
          "Develop and implement media labeling procedures",
          "Use color-coded labels for different classification levels",
          "Train personnel on media marking requirements",
          "Automate marking of digital media where possible",
          "Periodically audit media to ensure proper marking"
        ]
      },
      "MP-4": {
        "id": "MP-4",
        "family": "MP",
        "title": "Media Storage",
        "description": "Store digital and non-digital media securely in accordance with the sensitivity of the information.",
        "priority": "P1",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["CP-6", "CP-9", "MP-2", "MP-7", "PE-3"],
        "importance": "Secure media storage protects sensitive information from unauthorized physical access and environmental hazards that could lead to data loss.",
        "mitigationSuggestions": [
          "Use physically secured storage areas for sensitive media",
          "Implement environmental controls for media storage",
          "Encrypt sensitive data stored on digital media",
          "Maintain inventory of stored media",
          "Implement check-in/check-out procedures"
        ]
      }
    },
    "PA": {
      "PA-1": {
        "id": "PA-1",
        "family": "PA",
        "title": "Policy and Procedures",
        "description": "Establish and maintain physical and environmental protection policy and procedures.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PM-9", "PS-8", "SI-12"],
        "importance": "Physical security policies establish the foundation for protecting systems and information from physical threats and environmental hazards.",
        "mitigationSuggestions": [
          "Develop comprehensive physical security policies",
          "Define procedures for physical access control",
          "Establish environmental protection requirements",
          "Document visitor management procedures",
          "Review and update policies annually"
        ]
      },
      "PA-2": {
        "id": "PA-2",
        "family": "PA",
        "title": "Physical Access Authorizations",
        "description": "Develop, approve, and maintain a list of individuals with authorized access to the facility.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["PE-3", "PE-4", "PS-2", "PS-3", "PS-7"],
        "importance": "Controlling who is authorized to access facilities helps prevent unauthorized physical access to systems and information that could lead to theft or tampering.",
        "mitigationSuggestions": [
          "Maintain up-to-date access authorization lists",
          "Require formal access requests and approvals",
          "Review access authorizations periodically",
          "Integrate with personnel termination processes",
          "Implement least privilege for physical access"
        ]
      },
      "PA-3": {
        "id": "PA-3",
        "family": "PA",
        "title": "Physical Access Control",
        "description": "Enforce physical access authorizations at entry/exit points to the facility.",
        "priority": "P1",
        "baseline": ["LOW", "MODERATE", "HIGH"],
        "related": ["AT-3", "IA-4", "MA-5", "MP-2", "MP-4", "PE-2", "PE-4", "PE-5", "PE-8", "PS-2", "PS-3", "PS-7"],
        "importance": "Physical access controls ensure that only authorized individuals can physically access facilities containing sensitive systems and information.",
        "mitigationSuggestions": [
          "Implement card access systems or biometric controls",
          "Use guards at critical facility entry points",
          "Deploy mantrap entries for sensitive areas",
          "Implement visitor escort requirements",
          "Use CCTV to monitor access points"
        ]
      },
      "PA-4": {
        "id": "PA-4",
        "family": "PA",
        "title": "Access Control for Transmission",
        "description": "Control physical access to information system distribution and transmission lines within organizational facilities.",
        "priority": "P1",
        "baseline": ["MODERATE", "HIGH"],
        "related": ["PE-2", "PE-3", "PE-5", "SC-7", "SC-8"],
        "importance": "Protecting transmission lines prevents unauthorized access that could lead to information disclosure through tapping, physical damage, or signal interference.",
        "mitigationSuggestions": [
          "Use protected distribution systems for sensitive networks",
          "Secure wiring closets and communication rooms",
          "Install tamper-evident seals on network jacks",
          "Use fiber optic cabling where feasible",
          "Monitor for unauthorized connections to network lines"
        ]
      }
    }
};

// Helper function to get control details by ID
export function getControlDetails(family: string, controlId: string): ControlCatalogItem | undefined {
  return controlsCatalog[family]?.[controlId];
}

// Helper function to get a control's full name
export function getControlFullName(family: string, controlId: string): string {
  const control = getControlDetails(family, controlId);
  if (!control) return `${family}-${controlId}`;
  return `${family}-${controlId}: ${control.title}`;
}

/**
 * Helper function to explain baseline impact
 * @returns An explanation of what baseline impact levels mean
 */
export function getBaselineImpactExplanation(): string {
  return `
    Baseline Impact Levels indicate which systems require this control:
    
    • LOW - Required for systems where a security breach would have a limited adverse effect
    • MODERATE - Required where a breach would have a serious adverse effect
    • HIGH - Required where a breach would have a severe or catastrophic effect
    
    Controls are selected based on the system's security categorization per FIPS 199.
  `;
}

export default controlsCatalog; 