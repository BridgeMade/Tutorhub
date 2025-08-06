#!/usr/bin/env node

// ===========================================
// TEST RUNNER SCRIPT
// ===========================================

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestConfig {
  pattern?: string;
  coverage?: boolean;
  watch?: boolean;
  verbose?: boolean;
  updateSnapshot?: boolean;
  testNamePattern?: string;
}

class TestRunner {
  private config: TestConfig = {};

  constructor() {
    this.parseArgs();
  }

  private parseArgs(): void {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--coverage':
        case '-c':
          this.config.coverage = true;
          break;
        case '--watch':
        case '-w':
          this.config.watch = true;
          break;
        case '--verbose':
        case '-v':
          this.config.verbose = true;
          break;
        case '--update-snapshots':
        case '-u':
          this.config.updateSnapshot = true;
          break;
        case '--pattern':
        case '-p':
          this.config.pattern = args[++i];
          break;
        case '--test':
        case '-t':
          this.config.testNamePattern = args[++i];
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }
  }

  private showHelp(): void {
    console.log(`
TutorHub Test Runner

Usage: npm run test:custom [options]

Options:
  -w, --watch              Watch files for changes and rerun tests
  -c, --coverage           Generate test coverage report
  -v, --verbose            Display individual test results
  -u, --update-snapshots   Update snapshots
  -p, --pattern <pattern>  Run tests matching pattern
  -t, --test <name>        Run tests matching name pattern
  -h, --help               Show this help message

Examples:
  npm run test:custom --coverage
  npm run test:custom --pattern="services"
  npm run test:custom --test="cache" --verbose
  npm run test:custom --watch
`);
  }

  public run(): void {
    const command = this.buildCommand();
    
    console.log('🧪 Running TutorHub Tests...\n');
    console.log(`Command: ${command}\n`);

    try {
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('\n✅ All tests completed successfully!');
      
      if (this.config.coverage) {
        console.log('\n📊 Coverage report generated in coverage/ directory');
      }
    } catch (error) {
      console.log('\n❌ Tests failed!');
      process.exit(1);
    }
  }

  private buildCommand(): string {
    const baseCommand = 'npx react-scripts test';
    const options: string[] = [];

    if (!this.config.watch) {
      options.push('--watchAll=false');
    }

    if (this.config.coverage) {
      options.push('--coverage');
      options.push('--coverageDirectory=coverage');
      options.push('--collectCoverageFrom=src/**/*.{ts,tsx}');
      options.push('--collectCoverageFrom=!src/**/*.d.ts');
      options.push('--collectCoverageFrom=!src/index.tsx');
      options.push('--collectCoverageFrom=!src/reportWebVitals.ts');
    }

    if (this.config.verbose) {
      options.push('--verbose');
    }

    if (this.config.updateSnapshot) {
      options.push('--updateSnapshot');
    }

    if (this.config.pattern) {
      options.push(`--testPathPattern="${this.config.pattern}"`);
    }

    if (this.config.testNamePattern) {
      options.push(`--testNamePattern="${this.config.testNamePattern}"`);
    }

    return `${baseCommand} ${options.join(' ')}`;
  }
}

// Test suite definitions
const testSuites = {
  unit: {
    description: 'Unit tests for services, utilities, and components',
    pattern: '(services|utils|hooks)/__tests__',
    coverage: true
  },
  integration: {
    description: 'Integration tests for user workflows',
    pattern: '__tests__/integration',
    coverage: false
  },
  components: {
    description: 'Component tests for UI components',
    pattern: 'components/__tests__',
    coverage: true
  },
  performance: {
    description: 'Performance-related tests',
    pattern: '(performance|cache)',
    coverage: true
  },
  all: {
    description: 'All tests',
    pattern: '',
    coverage: true
  }
};

// Custom test commands
function runTestSuite(suite: keyof typeof testSuites): void {
  const config = testSuites[suite];
  
  console.log(`\n🚀 Running ${suite} tests: ${config.description}\n`);
  
  const runner = new TestRunner();
  runner['config'] = {
    pattern: config.pattern,
    coverage: config.coverage,
    verbose: true
  };
  
  runner.run();
}

// Export for use in package.json scripts
export { TestRunner, runTestSuite, testSuites };

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}