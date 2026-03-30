const fs = require('fs');
const path = require('path');

const currentAppPagePath = path.join(__dirname, 'frontend/src/app/page.tsx');
const newAppPagePath = path.join(__dirname, 'strxlndpg/src/app/page.tsx');

const currentCode = fs.readFileSync(currentAppPagePath, 'utf-8');
const newCode = fs.readFileSync(newAppPagePath, 'utf-8');

// The new components are:
// PlatformOverview
// PlatformFeaturesSection
// AlertsSection
// WhyZentinelSection
// IntegrationsSection
// TestimonialsSection
// FinalCTASection
// which are between "// Platform Overview Section" and "// Footer"

const newComponentsStartIdx = newCode.indexOf('// Platform Overview Section');
const newComponentsEndIdx = newCode.indexOf('// Footer');
const newComponentsCode = newCode.slice(newComponentsStartIdx, newComponentsEndIdx);

// The icons we need from lucide-react in the new components
const newIconsMatch = newCode.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]lucide-react['"]/);
const currentIconsMatch = currentCode.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]lucide-react['"]/);

let newIcons = [];
if (newIconsMatch) {
    newIcons = newIconsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
}
let currentIcons = [];
if (currentIconsMatch) {
    currentIcons = currentIconsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
}

const mergedIcons = Array.from(new Set([...currentIcons, ...newIcons]));

// Also we need Button, Badge, Card, CardContent, Accordion etc.
// But we won't bring Accordion because we use the existing FAQ.
const uiImports = `
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
`;

// Insert the new imports and combined lucide icons into currentCode
let updatedCode = currentCode.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]lucide-react['"];?/,
    `import { ${mergedIcons.join(', ')} } from "lucide-react";`
);

// Insert UI imports after lucide-react
updatedCode = updatedCode.replace(
    /import \{ BackgroundEffects \} from "@\/components\/BackgroundEffects";/,
    `import { BackgroundEffects } from "@/components/BackgroundEffects";\n${uiImports}`
);

// Inject the new components right before export default function HomePage
const homePageIdx = updatedCode.indexOf('export default function HomePage()');
updatedCode = updatedCode.slice(0, homePageIdx) + newComponentsCode + '\n' + updatedCode.slice(homePageIdx);

// Replace the sections in the main tag in HomePage
const heroEndIdx = updatedCode.indexOf('{/* --- Unified Platform Grid (Aikido Mapping) --- */}');
const faqStartIdx = updatedCode.indexOf('<FAQAccordion items={generalFaqs} />');

if (heroEndIdx !== -1 && faqStartIdx !== -1) {
    const replacementSections = `
                <PlatformOverview />
                <PlatformFeaturesSection />
                <AlertsSection />
                <WhyZentinelSection />
                <IntegrationsSection />
                <TestimonialsSection />
                <FinalCTASection />\n\n                `;
    
    updatedCode = updatedCode.slice(0, heroEndIdx) + replacementSections + updatedCode.slice(faqStartIdx);
}

fs.writeFileSync(currentAppPagePath, updatedCode);
console.log('Merged successfully!');
