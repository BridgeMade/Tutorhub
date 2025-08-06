#!/usr/bin/env node

// ===========================================
// ENVIRONMENT SETUP SCRIPT FOR TUTORHUB
// ===========================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class EnvironmentSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.config = {};
    this.environments = ['development', 'staging', 'production'];
  }

  // Utility functions
  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  async promptSelect(question, options) {
    this.log(`\n${question}`, 'cyan');
    options.forEach((option, index) => {
      this.log(`  ${index + 1}. ${option}`, 'blue');
    });
    
    const answer = await this.prompt('\nSelect option (number): ');
    const index = parseInt(answer) - 1;
    
    if (index >= 0 && index < options.length) {
      return options[index];
    } else {
      this.log('Invalid selection. Please try again.', 'red');
      return this.promptSelect(question, options);
    }
  }

  async promptBoolean(question, defaultValue = false) {
    const defaultText = defaultValue ? '(Y/n)' : '(y/N)';
    const answer = await this.prompt(`${question} ${defaultText}: `);
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      return true;
    } else if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
      return false;
    } else {
      return defaultValue;
    }
  }

  // Main setup flow
  async run() {
    this.log('\n🚀 TutorHub Environment Setup', 'bold');
    this.log('=====================================', 'cyan');
    
    try {
      // Check if .env files already exist
      await this.checkExistingConfig();
      
      // Select environment to configure
      this.config.environment = await this.promptSelect(
        'Which environment would you like to configure?',
        this.environments
      );
      
      // Gather configuration
      await this.gatherBasicConfig();
      await this.gatherSupabaseConfig();
      await this.gatherEmailConfig();
      await this.gatherSecurityConfig();
      await this.gatherFeatureFlags();
      await this.gatherDeploymentConfig();
      
      // Generate configuration files
      await this.generateEnvFile();
      await this.generateDockerEnv();
      
      // Display summary
      this.displaySummary();
      
      this.log('\n✅ Environment setup completed successfully!', 'green');
      
    } catch (error) {
      this.log(`\n❌ Setup failed: ${error.message}`, 'red');
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async checkExistingConfig() {
    const envFile = `.env.${this.config.environment || 'local'}`;
    
    if (fs.existsSync(envFile)) {
      const overwrite = await this.promptBoolean(
        `Configuration file ${envFile} already exists. Do you want to overwrite it?`,
        false
      );
      
      if (!overwrite) {
        this.log('Setup cancelled.', 'yellow');
        process.exit(0);
      }
    }
  }

  async gatherBasicConfig() {
    this.log('\n📋 Basic Configuration', 'bold');
    
    this.config.port = await this.prompt('Port (3000): ') || '3000';
    this.config.nodeEnv = this.config.environment === 'production' ? 'production' : 'development';
    
    if (this.config.environment === 'development') {
      this.config.generateSourcemap = await this.promptBoolean('Generate source maps?', true);
      this.config.debug = await this.promptBoolean('Enable debug mode?', false);
    } else {
      this.config.generateSourcemap = false;
      this.config.debug = false;
    }
  }

  async gatherSupabaseConfig() {
    this.log('\n🗄️  Supabase Configuration', 'bold');
    
    this.config.supabaseUrl = await this.prompt('Supabase URL: ');
    this.config.supabaseAnonKey = await this.prompt('Supabase Anon Key: ');
    
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error('Supabase configuration is required');
    }
    
    // Validate URL format
    try {
      new URL(this.config.supabaseUrl);
    } catch {
      throw new Error('Invalid Supabase URL format');
    }
  }

  async gatherEmailConfig() {
    this.log('\n📧 Email Configuration', 'bold');
    
    const configureEmail = await this.promptBoolean('Configure email service?', true);
    
    if (configureEmail) {
      this.config.emailApiKey = await this.prompt('Email API Key: ');
      this.config.fromEmail = await this.prompt('From Email (noreply@tutorhub.co.za): ') || 'noreply@tutorhub.co.za';
      this.config.fromName = await this.prompt('From Name (TutorHub): ') || 'TutorHub';
    }
  }

  async gatherSecurityConfig() {
    this.log('\n🔒 Security Configuration', 'bold');
    
    if (this.config.environment === 'production') {
      this.config.csrfSecret = this.generateSecret(32);
      this.config.jwtSecret = this.generateSecret(64);
      this.log('Security secrets generated automatically for production.', 'green');
    } else {
      this.config.csrfSecret = await this.prompt('CSRF Secret (leave empty to generate): ') || this.generateSecret(32);
      this.config.jwtSecret = await this.prompt('JWT Secret (leave empty to generate): ') || this.generateSecret(64);
    }
  }

  async gatherFeatureFlags() {
    this.log('\n🎛️  Feature Flags', 'bold');
    
    const features = [
      { key: 'advancedSearch', name: 'Advanced Search', default: true },
      { key: 'videoCalls', name: 'Video Calls Integration', default: false },
      { key: 'groupSessions', name: 'Group Sessions', default: true },
      { key: 'aiRecommendations', name: 'AI-Powered Recommendations', default: true },
      { key: 'paymentIntegration', name: 'Payment Integration', default: true }
    ];
    
    this.config.features = {};
    
    for (const feature of features) {
      this.config.features[feature.key] = await this.promptBoolean(
        `Enable ${feature.name}?`,
        feature.default
      );
    }
  }

  async gatherDeploymentConfig() {
    if (this.config.environment !== 'development') {
      this.log('\n🚀 Deployment Configuration', 'bold');
      
      const configureCloudflare = await this.promptBoolean('Configure Cloudflare deployment?', true);
      
      if (configureCloudflare) {
        this.config.cloudflareApiToken = await this.prompt('Cloudflare API Token: ');
        this.config.cloudflareAccountId = await this.prompt('Cloudflare Account ID: ');
      }
      
      const configureAnalytics = await this.promptBoolean('Configure analytics?', true);
      
      if (configureAnalytics) {
        this.config.googleAnalyticsId = await this.prompt('Google Analytics ID (optional): ');
        this.config.sentryDsn = await this.prompt('Sentry DSN (optional): ');
      }
    }
  }

  generateSecret(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async generateEnvFile() {
    const envFile = `.env.${this.config.environment === 'development' ? 'local' : this.config.environment}`;
    
    const content = this.buildEnvContent();
    
    fs.writeFileSync(envFile, content);
    this.log(`\n📝 Generated ${envFile}`, 'green');
  }

  buildEnvContent() {
    const lines = [
      '# ===========================================',
      `# TUTORHUB CONFIGURATION - ${this.config.environment.toUpperCase()}`,
      '# ===========================================',
      `# Generated on ${new Date().toISOString()}`,
      '',
      '# Application Settings',
      `REACT_APP_ENVIRONMENT=${this.config.environment}`,
      `NODE_ENV=${this.config.nodeEnv}`,
      `PORT=${this.config.port}`,
      ''
    ];

    // Supabase Configuration
    lines.push(
      '# Supabase Configuration',
      `REACT_APP_SUPABASE_URL=${this.config.supabaseUrl}`,
      `REACT_APP_SUPABASE_ANON_KEY=${this.config.supabaseAnonKey}`,
      ''
    );

    // Email Configuration
    if (this.config.emailApiKey) {
      lines.push(
        '# Email Configuration',
        `REACT_APP_EMAIL_API_KEY=${this.config.emailApiKey}`,
        `REACT_APP_FROM_EMAIL=${this.config.fromEmail}`,
        `REACT_APP_FROM_NAME=${this.config.fromName}`,
        ''
      );
    }

    // Security Configuration
    lines.push(
      '# Security Configuration',
      `REACT_APP_CSRF_SECRET=${this.config.csrfSecret}`,
      `REACT_APP_JWT_SECRET=${this.config.jwtSecret}`,
      ''
    );

    // Development Settings
    if (this.config.environment === 'development') {
      lines.push(
        '# Development Settings',
        `GENERATE_SOURCEMAP=${this.config.generateSourcemap}`,
        `REACT_APP_DEBUG=${this.config.debug}`,
        'BROWSER=none',
        'SKIP_PREFLIGHT_CHECK=true',
        ''
      );
    }

    // Feature Flags
    lines.push('# Feature Flags');
    for (const [key, value] of Object.entries(this.config.features || {})) {
      const envKey = `REACT_APP_FEATURE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
      lines.push(`${envKey}=${value}`);
    }
    lines.push('');

    // Deployment Configuration
    if (this.config.cloudflareApiToken) {
      lines.push(
        '# Cloudflare Configuration',
        `CLOUDFLARE_API_TOKEN=${this.config.cloudflareApiToken}`,
        `CLOUDFLARE_ACCOUNT_ID=${this.config.cloudflareAccountId}`,
        ''
      );
    }

    // Analytics Configuration
    if (this.config.googleAnalyticsId || this.config.sentryDsn) {
      lines.push('# Analytics & Monitoring');
      if (this.config.googleAnalyticsId) {
        lines.push(`REACT_APP_GOOGLE_ANALYTICS_ID=${this.config.googleAnalyticsId}`);
      }
      if (this.config.sentryDsn) {
        lines.push(`REACT_APP_SENTRY_DSN=${this.config.sentryDsn}`);
      }
      lines.push('');
    }

    // Performance Settings
    lines.push(
      '# Performance Settings',
      'REACT_APP_CACHE_TTL=300000',
      'REACT_APP_PERFORMANCE_MONITORING=true',
      'REACT_APP_ENABLE_SW=true',
      ''
    );

    return lines.join('\n');
  }

  async generateDockerEnv() {
    if (this.config.environment !== 'development') {
      const dockerEnvContent = [
        '# Docker Environment Variables',
        `NODE_ENV=${this.config.nodeEnv}`,
        `REACT_APP_ENVIRONMENT=${this.config.environment}`,
        `REACT_APP_SUPABASE_URL=${this.config.supabaseUrl}`,
        `REACT_APP_SUPABASE_ANON_KEY=${this.config.supabaseAnonKey}`,
        `GENERATE_SOURCEMAP=${this.config.generateSourcemap || false}`
      ].join('\n');

      fs.writeFileSync('.env.docker', dockerEnvContent);
      this.log('📝 Generated .env.docker', 'green');
    }
  }

  displaySummary() {
    this.log('\n📊 Configuration Summary', 'bold');
    this.log('========================', 'cyan');
    this.log(`Environment: ${this.config.environment}`, 'blue');
    this.log(`Port: ${this.config.port}`, 'blue');
    this.log(`Supabase URL: ${this.config.supabaseUrl}`, 'blue');
    this.log(`Email configured: ${this.config.emailApiKey ? 'Yes' : 'No'}`, 'blue');
    
    if (this.config.features) {
      this.log('\nEnabled Features:', 'yellow');
      for (const [key, value] of Object.entries(this.config.features)) {
        if (value) {
          this.log(`  ✓ ${key}`, 'green');
        }
      }
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new EnvironmentSetup();
  setup.run().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = EnvironmentSetup;