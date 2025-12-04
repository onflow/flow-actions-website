// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com/repos/onflow/FlowActions/contents';
const GITHUB_REPO_URL = 'https://github.com/onflow/FlowActions';

// Action type mappings for better display names
const ACTION_TYPE_MAP = {
    'Source': 'Source',
    'Sink': 'Sink',
    'Swapper': 'Swapper',
    'PriceOracle': 'Price Oracle',
    'Flasher': 'Flash Loan',
    'Connector': 'Connector',
    'Utils': 'Utilities'
};

// Category mappings based on file paths
const CATEGORY_MAP = {
    'FungibleToken': 'Token Operations',
    'Swap': 'Swap Operations',
    'ERC4626': 'Vault Operations',
    'EVM': 'EVM Integration',
    'IncrementFi': 'IncrementFi Protocol',
    'BandOracle': 'Oracle',
    'Uniswap': 'Uniswap Integration'
};

/**
 * Fetch all connector files recursively from GitHub
 */
async function fetchConnectors() {
    try {
        const connectors = [];
        
        // Fetch main connectors directory
        const mainConnectors = await fetchFromGitHub('cadence/contracts/connectors');
        
        for (const item of mainConnectors) {
            if (item.type === 'file' && item.name.endsWith('.cdc')) {
                connectors.push({
                    name: item.name,
                    path: item.path,
                    url: item.html_url,
                    size: item.size,
                    downloadUrl: item.download_url
                });
            } else if (item.type === 'dir') {
                // Recursively fetch subdirectories
                const subConnectors = await fetchConnectorsRecursive(item.path);
                connectors.push(...subConnectors);
            }
        }
        
        return connectors;
    } catch (error) {
        console.error('Error fetching connectors:', error);
        throw error;
    }
}

/**
 * Recursively fetch connectors from subdirectories
 */
async function fetchConnectorsRecursive(path) {
    const connectors = [];
    try {
        const items = await fetchFromGitHub(path);
        
        for (const item of items) {
            if (item.type === 'file' && item.name.endsWith('.cdc')) {
                connectors.push({
                    name: item.name,
                    path: item.path,
                    url: item.html_url,
                    size: item.size,
                    downloadUrl: item.download_url
                });
            } else if (item.type === 'dir') {
                const subConnectors = await fetchConnectorsRecursive(item.path);
                connectors.push(...subConnectors);
            }
        }
    } catch (error) {
        console.error(`Error fetching from ${path}:`, error);
    }
    
    return connectors;
}

/**
 * Fetch data from GitHub API
 */
async function fetchFromGitHub(path) {
    const url = `${GITHUB_API_BASE}/${path}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return []; // Return empty array for 404s (directory might not exist)
            }
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        // Handle network errors
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Unable to connect to GitHub. Please check your internet connection.');
        }
        throw error;
    }
}

/**
 * Get file content to extract metadata
 */
async function getFileContent(downloadUrl) {
    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) return null;
        return await response.text();
    } catch (error) {
        console.error('Error fetching file content:', error);
        return null;
    }
}

/**
 * Extract metadata from Cadence file content
 */
function extractMetadata(content, fileName) {
    const metadata = {
        title: formatTitle(fileName),
        description: '',
        type: 'Connector',
        category: detectCategory(fileName),
        tags: []
    };
    
    if (!content) return metadata;
    
    // Split content into lines for better parsing
    const lines = content.split('\n');
    
    // Extract struct/contract names
    const structMatch = content.match(/(?:pub\s+)?struct\s+(\w+)/g);
    const contractMatch = content.match(/pub\s+contract\s+(\w+)/g);
    
    // Find struct definitions and extract their documentation
    // Pattern: /// StructName\n///\n/// Description line 1\n/// Description line 2\n///\nstruct StructName
    const structDescriptions = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for struct definitions
        if (line.match(/^\s*access\(all\)\s+struct\s+\w+|^\s*pub\s+struct\s+\w+/)) {
            const structNameMatch = line.match(/struct\s+(\w+)/);
            if (structNameMatch) {
                const structName = structNameMatch[1];
                
                // Look backwards for documentation (up to 10 lines back)
                let docLines = [];
                let foundStructNameComment = false;
                
                for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
                    const prevLine = lines[j].trim();
                    
                    // Skip empty comment lines
                    if (prevLine === '///' || prevLine === '//') {
                        continue;
                    }
                    
                    // Skip beta warning lines
                    if (prevLine.includes('!!!') && prevLine.length > 50) {
                        break; // Stop if we hit a beta warning
                    }
                    
                    // Check if this is the struct name comment (e.g., "/// Sink")
                    if (prevLine.startsWith('///') && !foundStructNameComment) {
                        const commentContent = prevLine.replace(/^\/\/\/\s*/, '').trim();
                        // If it matches the struct name or is a single word, it's likely the struct name comment
                        if (commentContent === structName || (commentContent.length < 30 && !commentContent.includes(' '))) {
                            foundStructNameComment = true;
                            continue; // Skip the struct name line itself
                        }
                    }
                    
                    // Collect description lines (after the struct name comment)
                    if (prevLine.startsWith('///') && foundStructNameComment) {
                        const docContent = prevLine.replace(/^\/\/\/\s*/, '').trim();
                        if (docContent && docContent.length > 5) {
                            docLines.unshift(docContent); // Add to beginning to maintain order
                        } else {
                            // Empty comment line might be a separator, but continue collecting
                            continue;
                        }
                    } else if (prevLine.startsWith('///')) {
                        // Still collecting, might be before struct name comment
                        const docContent = prevLine.replace(/^\/\/\/\s*/, '').trim();
                        if (docContent && docContent.length > 5 && !docContent.match(/^[A-Z][a-zA-Z]+$/)) {
                            docLines.unshift(docContent);
                        }
                    } else if (prevLine && !prevLine.startsWith('//')) {
                        // Hit non-comment code, stop looking
                        break;
                    }
                }
                
                // If we found documentation, join it
                if (docLines.length > 0) {
                    const description = docLines.join(' ').trim();
                    // Filter out beta warnings
                    if (description && !description.includes('BETA') && !description.includes('NOT FINALIZED')) {
                        const exclamationCount = (description.match(/!/g) || []).length;
                        const totalChars = description.length;
                        if (exclamationCount / totalChars < 0.1) { // Less than 10% exclamation marks
                            structDescriptions.push({
                                name: structName,
                                description: description
                            });
                        }
                    }
                }
            }
        }
    }
    
    // Use the first struct description found, or look for contract-level documentation
    if (structDescriptions.length > 0) {
        // Prefer Source/Sink/Swapper descriptions as they're more specific
        const preferred = structDescriptions.find(s => 
            s.name.includes('Source') || s.name.includes('Sink') || 
            s.name.includes('Swapper') || s.name.includes('Oracle') || 
            s.name.includes('Price') || s.name.includes('Flash')
        );
        metadata.description = (preferred || structDescriptions[0]).description;
    } else {
        // Fallback: Look for contract-level documentation (after beta warning)
        let foundBetaWarning = false;
        let collectingDoc = false;
        let contractDocLines = [];
        
        for (let i = 0; i < lines.length && i < 50; i++) {
            const line = lines[i].trim();
            
            // Detect beta warning
            if (line.includes('!!!') && line.length > 50) {
                foundBetaWarning = true;
                continue;
            }
            
            // After beta warning, look for contract documentation
            if (foundBetaWarning && line.startsWith('///')) {
                const docContent = line.replace(/^\/\/\/\s*/, '').trim();
                
                // Skip empty comment lines
                if (docContent === '' || docContent.length < 3) {
                    if (collectingDoc && contractDocLines.length > 0) {
                        break; // End of documentation block
                    }
                    continue;
                }
                
                // Skip if it's just the contract name
                if (docContent.match(/^[A-Z][a-zA-Z]+$/) && contractDocLines.length === 0) {
                    continue;
                }
                
                // Skip beta-related text
                if (docContent.includes('BETA') || docContent.includes('NOT FINALIZED')) {
                    continue;
                }
                
                // Collect meaningful documentation
                if (docContent.length > 10) {
                    contractDocLines.push(docContent);
                    collectingDoc = true;
                }
            } else if (foundBetaWarning && line.startsWith('access(all) contract') || line.startsWith('pub contract')) {
                // Reached contract definition, stop
                break;
            } else if (collectingDoc && line && !line.startsWith('///') && !line.startsWith('//')) {
                // Hit code, stop collecting
                break;
            }
        }
        
        if (contractDocLines.length > 0) {
            metadata.description = contractDocLines.join(' ').trim();
        }
    }
    
    // Clean up description - remove any that are mostly exclamation marks or beta warnings
    if (metadata.description) {
        const exclamationCount = (metadata.description.match(/!/g) || []).length;
        const totalChars = metadata.description.length;
        // If more than 10% are exclamation marks, it's probably not good
        if (exclamationCount / totalChars > 0.1) {
            metadata.description = '';
        }
        // Remove beta warning text
        if (metadata.description.includes('BETA') && metadata.description.includes('NOT FINALIZED')) {
            metadata.description = '';
        }
    }
    
    // Fallback: Generate description from file name if no good description found
    if (!metadata.description || metadata.description.length < 20) {
        metadata.description = generateDescriptionFromName(fileName, metadata);
    }
    
    // Detect action types from struct names
    if (structMatch || contractMatch) {
        const allMatches = [...(structMatch || []), ...(contractMatch || [])];
        for (const match of allMatches) {
            const name = match.split(/\s+/).pop();
            if (name.includes('Source')) {
                metadata.type = 'Source';
                metadata.tags.push('Source');
            } else if (name.includes('Sink')) {
                metadata.type = 'Sink';
                metadata.tags.push('Sink');
            } else if (name.includes('Swapper') || name.includes('Swap')) {
                metadata.type = 'Swapper';
                metadata.tags.push('Swap');
            } else if (name.includes('Oracle') || name.includes('Price')) {
                metadata.type = 'PriceOracle';
                metadata.tags.push('Oracle');
            } else if (name.includes('Flash')) {
                metadata.type = 'Flasher';
                metadata.tags.push('Flash Loan');
            }
        }
    }
    
    // Extract additional tags from content
    if (content.includes('FungibleToken')) {
        metadata.tags.push('FungibleToken');
    }
    if (content.includes('ERC4626')) {
        metadata.tags.push('ERC4626');
    }
    if (content.includes('EVM')) {
        metadata.tags.push('EVM');
    }
    if (content.includes('IncrementFi') || content.includes('Increment')) {
        metadata.tags.push('IncrementFi');
    }
    if (content.includes('Band')) {
        metadata.tags.push('Band Protocol');
    }
    if (content.includes('Uniswap')) {
        metadata.tags.push('Uniswap');
    }
    
    return metadata;
}

/**
 * Generate a meaningful description from the file name
 */
function generateDescriptionFromName(fileName, metadata) {
    const title = metadata.title || formatTitle(fileName);
    const category = metadata.category;
    const type = metadata.type;
    
    let desc = '';
    
    if (fileName.includes('FungibleToken')) {
        desc = `Generic ${type.toLowerCase()} connector for FungibleToken vaults. `;
    } else if (fileName.includes('EVM')) {
        if (fileName.includes('Native') && fileName.includes('FLOW')) {
            desc = `DeFiActions connector that ${type === 'Sink' ? 'deposits' : 'withdraws'} FLOW to/from EVM addresses as EVM-native FLOW. `;
        } else {
            desc = `DeFiActions connector for EVM integration. `;
        }
    } else if (fileName.includes('Swap')) {
        desc = `DeFiActions connector for token swapping operations. `;
    } else if (fileName.includes('ERC4626')) {
        desc = `DeFiActions connector for ERC4626 vault operations. `;
    } else if (fileName.includes('IncrementFi')) {
        desc = `DeFiActions connector for IncrementFi protocol integration. `;
    } else if (fileName.includes('Band') || fileName.includes('Oracle')) {
        desc = `DeFiActions connector for price oracle operations. `;
    } else if (fileName.includes('Uniswap')) {
        desc = `DeFiActions connector for Uniswap integration. `;
    } else {
        desc = `Flow Actions ${type.toLowerCase()} connector. `;
    }
    
    desc += `Part of the ${category} category.`;
    
    return desc;
}

/**
 * Format a human-friendly title from filename
 */
function formatTitle(fileName) {
    // Remove .cdc extension
    let title = fileName.replace(/\.cdc$/, '');
    
    // Define common acronyms that should not be split (ordered by length, longest first)
    const acronyms = [
        'ERC4626', 'ERC1155', 'ERC721', 'ERC20',
        'EVM', 'FLOW', 'DeFi', 'UFix64', 'Fix64',
        'DEX', 'NFT', 'DAO', 'API', 'URL', 'NAV', 'COA', 'DFA',
        'HTTP', 'HTTPS', 'JSON', 'XML', 'HTML', 'CSS'
    ];
    
    // Create a map to store acronym replacements (use lowercase placeholders)
    const acronymMap = new Map();
    let placeholderIndex = 0;
    
    // Replace acronyms with lowercase placeholders (case-insensitive, but preserve original case)
    for (const acronym of acronyms) {
        const regex = new RegExp(acronym, 'gi');
        const matches = title.match(regex);
        if (matches) {
            // Use the first match to preserve original casing
            const originalAcronym = title.match(new RegExp(acronym, 'i'))[0];
            const placeholder = `__acronym${placeholderIndex}__`;
            acronymMap.set(placeholder, originalAcronym);
            title = title.replace(regex, placeholder);
            placeholderIndex++;
        }
    }
    
    // Split on word boundaries: 
    // - Before capital letters (but not if previous char is also capital or is part of acronym placeholder)
    // - This handles: camelCase -> "camel Case", PascalCase -> "Pascal Case"
    title = title.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Also split on transition from acronym placeholder to capital letter
    title = title.replace(/(__acronym\d+__)([A-Z])/g, '$1 $2');
    // Split on transition from word (ending in lowercase) to acronym placeholder
    title = title.replace(/([a-z])(__acronym\d+__)/g, '$1 $2');
    // Split on transition from capital letter to acronym placeholder
    title = title.replace(/([A-Z])(__acronym\d+__)/g, '$1 $2');
    
    // Restore acronyms from placeholders
    for (const [placeholder, acronym] of acronymMap.entries()) {
        title = title.replace(new RegExp(placeholder, 'g'), acronym);
    }
    
    // Handle special cases
    title = title.replace(/Connectors?/g, '');
    title = title.replace(/Increment Fi/g, 'IncrementFi');
    title = title.replace(/Band Oracle/g, 'Band Oracle');
    
    // Clean up multiple spaces
    title = title.replace(/\s+/g, ' ').trim();
    
    return title.trim() || fileName.replace(/\.cdc$/, '');
}

/**
 * Detect category from filename
 */
function detectCategory(fileName) {
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
        if (fileName.includes(key)) {
            return value;
        }
    }
    return 'General';
}

/**
 * Render actions to the page
 */
async function renderActions() {
    const grid = document.getElementById('actions-grid');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    
    try {
        // Fetch connectors
        const connectors = await fetchConnectors();
        
        // Hide loading
        loading.style.display = 'none';
        
        if (connectors.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1 / -1;">No actions found.</p>';
            return;
        }
        
        // Fetch metadata for each connector (in batches to avoid rate limiting)
        const batchSize = 5;
        for (let i = 0; i < connectors.length; i += batchSize) {
            const batch = connectors.slice(i, i + batchSize);
            await Promise.all(batch.map(async (connector) => {
                try {
                    if (connector.downloadUrl) {
                        const content = await getFileContent(connector.downloadUrl);
                        connector.metadata = extractMetadata(content, connector.name);
                    } else {
                        connector.metadata = extractMetadata(null, connector.name);
                    }
                } catch (error) {
                    // If metadata extraction fails, use defaults
                    console.warn(`Failed to extract metadata for ${connector.name}:`, error);
                    connector.metadata = extractMetadata(null, connector.name);
                }
            }));
            
            // Small delay between batches to be respectful to GitHub API
            if (i + batchSize < connectors.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Sort connectors by category and name
        connectors.sort((a, b) => {
            const categoryCompare = (a.metadata?.category || '').localeCompare(b.metadata?.category || '');
            if (categoryCompare !== 0) return categoryCompare;
            return (a.metadata?.title || a.name).localeCompare(b.metadata?.title || b.name);
        });
        
        // Collect all unique action types for filtering (only the types shown in top-right badge)
        const allActionTypes = new Set();
        connectors.forEach(connector => {
            const metadata = connector.metadata || {};
            const type = ACTION_TYPE_MAP[metadata.type] || metadata.type || 'Connector';
            allActionTypes.add(type);
        });
        
        // Render filter buttons (only action types)
        renderFilters(Array.from(allActionTypes).sort());
        
        // Render action cards
        grid.innerHTML = connectors.map((connector, index) => {
            const metadata = connector.metadata || {};
            const title = metadata.title || formatTitle(connector.name);
            let description = metadata.description || `Flow Action connector for ${title}`;
            // Truncate description if too long (as backup to CSS)
            if (description.length > 200) {
                description = description.substring(0, 197) + '...';
            }
            const type = ACTION_TYPE_MAP[metadata.type] || metadata.type || 'Connector';
            const category = metadata.category || 'General';
            const tags = [...new Set([category, ...(metadata.tags || [])])];
            
            // Create data attribute with only the action type for filtering (matches top-right badge)
            const dataTags = escapeHtml(type);
            
            return `
                <div class="action-card" data-tags="${dataTags}" onclick="window.open('${connector.url}', '_blank')">
                    <div class="action-card-header">
                        <div class="action-title-wrapper">
                            <div class="action-title">${escapeHtml(title)}</div>
                            <div class="action-path">${escapeHtml(connector.path)}</div>
                        </div>
                        <span class="action-type">${escapeHtml(type)}</span>
                    </div>
                    <div class="action-description">${escapeHtml(description)}</div>
                    ${tags.length > 0 ? `
                        <div class="action-meta">
                            ${tags.slice(0, 3).map(tag => `<span class="action-tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="action-footer">
                        <a href="${connector.url}" class="action-link" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
                            View on GitHub
                        </a>
                    </div>
                </div>
            `;
        }).join('');
        
        // Initialize filter functionality
        initializeFilters();
        
    } catch (error) {
        console.error('Error rendering actions:', error);
        loading.style.display = 'none';
        errorMessage.style.display = 'block';
        grid.innerHTML = '';
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render filter buttons
 */
function renderFilters(tags) {
    const filtersContainer = document.getElementById('filters-container');
    const filtersList = document.getElementById('filters-list');
    
    if (tags.length === 0) {
        filtersContainer.style.display = 'none';
        return;
    }
    
    filtersContainer.style.display = 'block';
    filtersList.innerHTML = tags.map(tag => `
        <button class="filter-btn" data-tag="${escapeHtml(tag)}" aria-label="Filter by ${escapeHtml(tag)}">
            ${escapeHtml(tag)}
        </button>
    `).join('');
}

/**
 * Initialize filter functionality
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearButton = document.getElementById('clear-filters');
    const actionCards = document.querySelectorAll('.action-card');
    let activeFilters = new Set();
    
    // Filter button click handler
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tag = button.getAttribute('data-tag');
            
            if (activeFilters.has(tag)) {
                activeFilters.delete(tag);
                button.classList.remove('active');
            } else {
                activeFilters.add(tag);
                button.classList.add('active');
            }
            
            applyFilters(activeFilters, actionCards);
        });
    });
    
    // Clear filters button
    clearButton.addEventListener('click', () => {
        activeFilters.clear();
        filterButtons.forEach(btn => btn.classList.remove('active'));
        applyFilters(activeFilters, actionCards);
    });
}

/**
 * Apply filters to action cards
 */
function applyFilters(activeFilters, actionCards) {
    if (activeFilters.size === 0) {
        // Show all cards if no filters are active
        actionCards.forEach(card => {
            card.style.display = '';
        });
    } else {
        // Show only cards that match the active filter (data-tags now contains only the action type)
        actionCards.forEach(card => {
            const cardActionType = card.getAttribute('data-tags');
            const hasMatchingType = activeFilters.has(cardActionType);
            card.style.display = hasMatchingType ? '' : 'none';
        });
    }
    
    // Update results count
    const visibleCount = Array.from(actionCards).filter(card => 
        card.style.display !== 'none'
    ).length;
    updateResultsCount(visibleCount, actionCards.length);
}

/**
 * Update results count display
 */
function updateResultsCount(visible, total) {
    const marketplaceHeader = document.querySelector('.marketplace-header h3');
    if (visible === total) {
        marketplaceHeader.textContent = 'Available Actions';
    } else {
        marketplaceHeader.textContent = `Available Actions (${visible} of ${total})`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderActions();
});

