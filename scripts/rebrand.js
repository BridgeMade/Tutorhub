#!/usr/bin/env node

// ===========================================
// REBRANDING UTILITY FOR APPLICATION
// ===========================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class RebrandingUtility {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.currentBrand = {
      name: 'TutorHub',
      slug: 'tutorhub',
      domain: 'tutorhub.co.za',
      description: 'Connect with qualified tutors for personalized learning'
    };
    
    this.newBrand = {};
    this.filesToUpdate = [];
  }

  // Color codes for console output
  log(message, color = 'reset') {
    const colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      bold: '\x1b[1m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  async run() {
    this.log('\n🔄 Application Rebranding Utility', 'bold');
    this.log('====================================', 'cyan');
    
    try {
      await this.gatherBrandInfo();
      await this.analyzeCodebase();
      await this.showUpdatePreview();
      
      const confirm = await this.prompt('\nProceed with rebranding? (y/N): ');
      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        await this.executeRebranding();
        this.log('\n✅ Rebranding completed successfully!', 'green');
      } else {
        this.log('\n❌ Rebranding cancelled.', 'yellow');
      }
      
    } catch (error) {
      this.log(`\n❌ Rebranding failed: ${error.message}`, 'red');
    } finally {
      this.rl.close();
    }
  }

  async gatherBrandInfo() {
    this.log('\n📝 Current Brand Information:', 'blue');
    this.log(`Name: ${this.currentBrand.name}`);
    this.log(`Slug: ${this.currentBrand.slug}`);
    this.log(`Domain: ${this.currentBrand.domain}`);
    this.log(`Description: ${this.currentBrand.description}`);
    
    this.log('\n📝 Enter New Brand Information:', 'blue');
    
    this.newBrand.name = await this.prompt('New application name: ');
    if (!this.newBrand.name) {
      throw new Error('Application name is required');
    }
    
    this.newBrand.slug = await this.prompt(`URL slug (${this.generateSlug(this.newBrand.name)}): `) || this.generateSlug(this.newBrand.name);
    this.newBrand.domain = await this.prompt('New domain (optional): ') || `${this.newBrand.slug}.co.za`;
    this.newBrand.description = await this.prompt('New description: ') || `${this.newBrand.name} - Modern tutoring platform`;
    
    // Generate additional brand variations
    this.newBrand.nameUpper = this.newBrand.name.toUpperCase();
    this.newBrand.nameLower = this.newBrand.name.toLowerCase();
    this.newBrand.slugUpper = this.newBrand.slug.toUpperCase();
    this.newBrand.slugLower = this.newBrand.slug.toLowerCase();
  }

  generateSlug(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async analyzeCodebase() {
    this.log('\n🔍 Analyzing codebase for brand references...', 'blue');
    
    this.filesToUpdate = [
      // Configuration files
      { file: 'package.json', type: 'json' },
      { file: 'public/manifest.json', type: 'json' },
      { file: 'public/index.html', type: 'html' },
      
      // Documentation
      { file: 'README.md', type: 'markdown' },
      { file: 'docs/branding-strategy.md', type: 'markdown' },
      
      // Environment files
      { file: '.env.example', type: 'env' },
      
      // Deployment configurations
      { file: 'Dockerfile', type: 'docker' },
      { file: 'docker-compose.yml', type: 'yaml' },
      { file: '.github/workflows/ci-cd.yml', type: 'yaml' },
      { file: 'scripts/deploy.sh', type: 'shell' },
      
      // Component files (will scan directory)
      { file: 'src/components', type: 'directory' },
      { file: 'src/pages', type: 'directory' },
      { file: 'src/services', type: 'directory' }
    ];
    
    // Scan for existing files
    this.filesToUpdate = this.filesToUpdate.filter(item => {
      const exists = fs.existsSync(item.file);
      if (!exists) {
        this.log(`⚠️  File not found: ${item.file}`, 'yellow');
      }
      return exists;
    });
    
    this.log(`Found ${this.filesToUpdate.length} files/directories to update`, 'green');
  }

  async showUpdatePreview() {
    this.log('\n📋 Rebranding Preview:', 'cyan');
    this.log('====================', 'cyan');
    
    this.log(`\n🏷️  Brand Changes:`);
    this.log(`   ${this.currentBrand.name} → ${this.newBrand.name}`);
    this.log(`   ${this.currentBrand.slug} → ${this.newBrand.slug}`);
    this.log(`   ${this.currentBrand.domain} → ${this.newBrand.domain}`);
    
    this.log(`\n📁 Files to Update:`);
    this.filesToUpdate.forEach(item => {
      this.log(`   ✓ ${item.file}`, 'green');
    });
    
    this.log(`\n🔄 Text Replacements:`);
    const replacements = this.getReplacements();
    Object.entries(replacements).slice(0, 5).forEach(([old, newText]) => {
      this.log(`   "${old}" → "${newText}"`);
    });
    this.log(`   ... and ${Object.keys(replacements).length - 5} more`);
  }

  getReplacements() {
    return {
      // Exact name matches
      [this.currentBrand.name]: this.newBrand.name,
      [this.currentBrand.slug]: this.newBrand.slug,
      [this.currentBrand.domain]: this.newBrand.domain,
      
      // Case variations
      [this.currentBrand.name.toUpperCase()]: this.newBrand.nameUpper,
      [this.currentBrand.name.toLowerCase()]: this.newBrand.nameLower,
      [this.currentBrand.slug.toUpperCase()]: this.newBrand.slugUpper,
      [this.currentBrand.slug.toLowerCase()]: this.newBrand.slugLower,
      
      // URL and path variations
      [`https://${this.currentBrand.domain}`]: `https://${this.newBrand.domain}`,
      [`http://${this.currentBrand.domain}`]: `http://${this.newBrand.domain}`,
      [`www.${this.currentBrand.domain}`]: `www.${this.newBrand.domain}`,
      
      // Project names in configs
      [`"name": "${this.currentBrand.slug}"`]: `"name": "${this.newBrand.slug}"`,
      [`"short_name": "${this.currentBrand.name}"`]: `"short_name": "${this.newBrand.name}"`,
      
      // Docker and deployment names
      [`tutorhub-`]: `${this.newBrand.slug}-`,
      [`TUTORHUB_`]: `${this.newBrand.slugUpper}_`,
      
      // Description updates
      [this.currentBrand.description]: this.newBrand.description
    };
  }

  async executeRebranding() {
    this.log('\n🚀 Executing rebranding...', 'blue');
    
    const replacements = this.getReplacements();
    let totalReplacements = 0;
    
    for (const item of this.filesToUpdate) {
      if (item.type === 'directory') {
        const dirReplacements = await this.updateDirectory(item.file, replacements);
        totalReplacements += dirReplacements;
      } else {
        const fileReplacements = await this.updateFile(item.file, replacements);
        totalReplacements += fileReplacements;
      }
    }
    
    // Create backup of original branding info
    await this.createBrandingBackup();
    
    // Update specific configuration files with structured data
    await this.updatePackageJson();
    await this.updateManifestJson();
    await this.updateIndexHtml();
    
    this.log(`\n📊 Summary: ${totalReplacements} replacements made across ${this.filesToUpdate.length} files/directories`, 'green');
  }

  async updateFile(filePath, replacements) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let replacementCount = 0;
      
      Object.entries(replacements).forEach(([oldText, newText]) => {
        const regex = new RegExp(this.escapeRegex(oldText), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, newText);
          replacementCount += matches.length;
        }
      });
      
      if (replacementCount > 0) {
        fs.writeFileSync(filePath, content);
        this.log(`   ✓ ${filePath} (${replacementCount} changes)`, 'green');
      }
      
      return replacementCount;
    } catch (error) {
      this.log(`   ❌ Failed to update ${filePath}: ${error.message}`, 'red');
      return 0;
    }
  }

  async updateDirectory(dirPath, replacements) {
    let totalReplacements = 0;
    
    try {
      const files = this.getAllFiles(dirPath, ['.tsx', '.ts', '.js', '.jsx', '.md']);
      
      for (const file of files) {
        const replacements_count = await this.updateFile(file, replacements);
        totalReplacements += replacements_count;
      }
      
    } catch (error) {
      this.log(`   ❌ Failed to process directory ${dirPath}: ${error.message}`, 'red');
    }
    
    return totalReplacements;
  }

  getAllFiles(dirPath, extensions, fileList = []) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and build directories
        if (!['node_modules', 'build', '.git', 'coverage'].includes(file)) {
          this.getAllFiles(filePath, extensions, fileList);
        }
      } else {
        const ext = path.extname(file);
        if (extensions.includes(ext)) {
          fileList.push(filePath);
        }
      }
    });
    
    return fileList;
  }

  async updatePackageJson() {
    try {
      const packagePath = 'package.json';
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        packageJson.name = this.newBrand.slug;
        packageJson.description = this.newBrand.description;
        
        if (packageJson.homepage) {
          packageJson.homepage = `https://${this.newBrand.domain}`;
        }
        
        if (packageJson.repository && packageJson.repository.url) {
          packageJson.repository.url = packageJson.repository.url.replace(this.currentBrand.slug, this.newBrand.slug);
        }
        
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        this.log(`   ✓ Updated package.json with structured data`, 'green');
      }
    } catch (error) {
      this.log(`   ❌ Failed to update package.json: ${error.message}`, 'red');
    }
  }

  async updateManifestJson() {
    try {
      const manifestPath = 'public/manifest.json';
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        manifest.name = this.newBrand.name;
        manifest.short_name = this.newBrand.name;
        manifest.description = this.newBrand.description;
        
        if (manifest.start_url) {
          manifest.start_url = '/';
        }
        
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        this.log(`   ✓ Updated manifest.json with structured data`, 'green');
      }
    } catch (error) {
      this.log(`   ❌ Failed to update manifest.json: ${error.message}`, 'red');
    }
  }

  async updateIndexHtml() {
    try {
      const indexPath = 'public/index.html';
      if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        
        // Update title
        content = content.replace(/<title>.*<\/title>/, `<title>${this.newBrand.name}</title>`);
        
        // Update meta description
        content = content.replace(
          /(<meta\s+name="description"\s+content=")[^"]*(")/,
          `$1${this.newBrand.description}$2`
        );
        
        fs.writeFileSync(indexPath, content);
        this.log(`   ✓ Updated index.html with structured data`, 'green');
      }
    } catch (error) {
      this.log(`   ❌ Failed to update index.html: ${error.message}`, 'red');
    }
  }

  async createBrandingBackup() {
    const backupData = {
      timestamp: new Date().toISOString(),
      previousBrand: this.currentBrand,
      newBrand: this.newBrand,
      filesUpdated: this.filesToUpdate.map(f => f.file)
    };
    
    const backupPath = `branding-backup-${Date.now()}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    this.log(`   ✓ Created branding backup: ${backupPath}`, 'green');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Run the utility if called directly
if (require.main === module) {
  const utility = new RebrandingUtility();
  utility.run().catch(console.error);
}

module.exports = RebrandingUtility;