module.exports = {
  // Test coverage requirements
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  },
  
  // Performance budgets
  performance: {
    // Core Web Vitals
    firstContentfulPaint: 1500, // ms
    largestContentfulPaint: 2500, // ms
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100, // ms
    timeToInteractive: 3500, // ms
    
    // Bundle size limits
    bundleSize: {
      javascript: 300, // KB
      css: 50, // KB
      images: 500, // KB per image
      total: 1000 // KB total page weight
    }
  },
  
  // Accessibility requirements
  accessibility: {
    wcagLevel: 'AA',
    colorContrast: {
      normal: 4.5,
      large: 3
    },
    keyboardNavigation: true,
    screenReaderSupport: true,
    altTextRequired: true,
    headingStructure: true,
    landmarkRegions: true
  },
  
  // Code quality thresholds
  codeQuality: {
    complexity: {
      max: 10, // Cyclomatic complexity per function
      average: 5
    },
    duplicates: {
      threshold: 3, // Percentage of duplicate code allowed
      minLines: 5 // Minimum lines to be considered duplicate
    },
    maintainability: {
      minIndex: 70 // Maintainability index (0-100)
    }
  },
  
  // Security requirements
  security: {
    dependencies: {
      allowedVulnerabilities: {
        low: 10,
        moderate: 5,
        high: 0,
        critical: 0
      }
    },
    headers: {
      required: [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Strict-Transport-Security'
      ]
    }
  },
  
  // TypeScript specific
  typescript: {
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  },
  
  // Environment-specific overrides
  environments: {
    development: {
      coverage: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60
      },
      performance: {
        firstContentfulPaint: 3000,
        largestContentfulPaint: 5000
      }
    },
    test: {
      coverage: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70
      }
    },
    acceptance: {
      // Same as production defaults
    },
    production: {
      // Use default values
    }
  }
}