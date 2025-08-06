// ===========================================
// REBRANDING UTILITY SCRIPT
// ===========================================
// Script to update all brand references throughout the codebase

export interface RebrandingConfig {
  oldName: string;
  newName: string;
  oldSlug: string;
  newSlug: string;
  updateFiles: string[];
  updateDatabase: boolean;
}

// Rebranding configurations for each platform name option
export const PLATFORM_REBRANDING_OPTIONS = {
  tutorOS: {
    oldName: 'TutorHub',
    newName: 'tutorOS',
    oldSlug: 'tutorhub',
    newSlug: 'tutorios',
    brandingStrategy: {
      tagline: 'The Operating System for Tutoring Businesses',
      positioning: 'B2B SaaS Platform',
      colors: {
        primary: '#2563eb', // Professional blue
        secondary: '#64748b', // Neutral gray
        accent: '#059669', // Success green
      },
      domains: [
        'tutorios.com',
        'gettutorios.com',
        'tutorios.io'
      ]
    }
  },
  eduflow: {
    oldName: 'TutorHub',
    newName: 'Eduflow',
    oldSlug: 'tutorhub',
    newSlug: 'eduflow',
    brandingStrategy: {
      tagline: 'Streamline Your Tutoring Operations',
      positioning: 'Workflow Optimization Platform',
      colors: {
        primary: '#6366f1', // Indigo
        secondary: '#64748b', // Neutral gray
        accent: '#10b981', // Emerald
      },
      domains: [
        'eduflow.com',
        'geteduflow.com',
        'eduflow.io'
      ]
    }
  },
  tutorsuite: {
    oldName: 'TutorHub',
    newName: 'Tutorsuite',
    oldSlug: 'tutorhub',
    newSlug: 'tutorsuite',
    brandingStrategy: {
      tagline: 'Complete Tutoring Business Suite',
      positioning: 'All-in-One Business Platform',
      colors: {
        primary: '#7c3aed', // Purple
        secondary: '#64748b', // Neutral gray
        accent: '#f59e0b', // Amber
      },
      domains: [
        'tutorsuite.com',
        'gettutorsuite.com',
        'tutorsuite.io'
      ]
    }
  },
  tutorkai: {
    oldName: 'TutorHub',
    newName: 'TutorKai',
    oldSlug: 'tutorhub',
    newSlug: 'tutorkai',
    brandingStrategy: {
      tagline: 'The Future of Tutoring Business Management',
      positioning: 'Next-Generation Intelligent Business Platform',
      vision: 'Market-Leading Innovation in Education Technology',
      colors: {
        primary: '#6366f1', // Innovative indigo - tech leadership
        secondary: '#64748b', // Neutral gray
        accent: '#8b5cf6', // Purple - innovation and ambition
      },
      domains: [
        'tutorkai.com',
        'gettutorkai.com',
        'tutorkai.io'
      ],
      messaging: {
        ambitious: 'Revolutionizing how tutoring businesses operate',
        innovative: 'Next-generation platform built for market leaders',
        target: 'Tech-forward tutoring companies seeking competitive advantage'
      }
    }
  }
};

// Files that need to be updated during rebranding
export const FILES_TO_UPDATE = [
  // Package and config files
  'package.json',
  'package-lock.json',
  'public/index.html',
  'public/manifest.json',
  
  // Source code files
  'src/App.tsx',
  'src/components/common/Header.tsx',
  'src/components/common/Footer.tsx',
  'src/components/navigation/Sidebar.tsx',
  'src/contexts/BrandContext.tsx',
  'src/components/branding/BrandedComponents.tsx',
  
  // Documentation
  'README.md',
  'docs/saas-branding-strategy.md',
  'src/assets/branding/README.md',
  
  // Database
  'src/database/multitenant_branding_schema.sql',
  
  // Configuration
  'tailwind.config.js',
  'vite.config.ts',
  '.env.example',
  
  // Deployment
  'Dockerfile',
  'scripts/deploy.sh',
  '.github/workflows/ci-cd.yml'
];

// Text replacements to perform
export const createReplacementRules = (config: RebrandingConfig) => [
  // Application name replacements
  {
    pattern: new RegExp(config.oldName, 'g'),
    replacement: config.newName,
    description: 'Replace application name'
  },
  {
    pattern: new RegExp(config.oldName.toLowerCase(), 'g'),
    replacement: config.newName.toLowerCase(),
    description: 'Replace lowercase application name'
  },
  {
    pattern: new RegExp(config.oldSlug, 'g'),
    replacement: config.newSlug,
    description: 'Replace application slug'
  },
  
  // Package name and URLs
  {
    pattern: /"name":\s*"tutorhub"/g,
    replacement: `"name": "${config.newSlug}"`,
    description: 'Update package.json name'
  },
  {
    pattern: /homepage.*tutorhub/g,
    replacement: `homepage": "https://${config.newSlug}.com"`,
    description: 'Update homepage URL'
  },
  
  // Title and meta tags
  {
    pattern: /<title>.*TutorHub.*<\/title>/g,
    replacement: `<title>${config.newName} - The Operating System for Tutoring Businesses</title>`,
    description: 'Update HTML title'
  },
  {
    pattern: /content=".*TutorHub.*"/g,
    replacement: `content="${config.newName} - Professional tutoring business management platform"`,
    description: 'Update meta descriptions'
  },
  
  // Database references
  {
    pattern: /companyName.*TutorHub/g,
    replacement: `companyName: '${config.newName}'`,
    description: 'Update default company name'
  },
  {
    pattern: /tenantName.*TutorHub/g,
    replacement: `tenantName: '${config.newName}'`,
    description: 'Update default tenant name'
  },
  
  // Comments and documentation
  {
    pattern: /# TutorHub/g,
    replacement: `# ${config.newName}`,
    description: 'Update documentation headers'
  },
  {
    pattern: /\* TutorHub/g,
    replacement: `* ${config.newName}`,
    description: 'Update comment blocks'
  }
];

// Function to execute rebranding
export const executeRebranding = async (platformChoice: keyof typeof PLATFORM_REBRANDING_OPTIONS) => {
  const config = PLATFORM_REBRANDING_OPTIONS[platformChoice];
  
  console.log(`🎨 Starting rebranding to ${config.newName}...`);
  console.log(`📋 Strategy: ${config.brandingStrategy.tagline}`);
  console.log(`🎯 Positioning: ${config.brandingStrategy.positioning}`);
  
  // This would be implemented with actual file system operations
  // For now, it returns the configuration for manual implementation
  return {
    platformName: config.newName,
    slug: config.newSlug,
    branding: config.brandingStrategy,
    filesToUpdate: FILES_TO_UPDATE,
    replacementRules: createReplacementRules({
      oldName: config.oldName,
      newName: config.newName,
      oldSlug: config.oldSlug,
      newSlug: config.newSlug,
      updateFiles: FILES_TO_UPDATE,
      updateDatabase: true
    })
  };
};

// Export the recommended choice
export const RECOMMENDED_PLATFORM = 'tutorkai';

export default {
  PLATFORM_REBRANDING_OPTIONS,
  executeRebranding,
  RECOMMENDED_PLATFORM
};