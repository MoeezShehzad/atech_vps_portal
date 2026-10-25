// ==============================================================================
// Component: DynamicPolicyRenderer.tsx
// Purpose: Renders database-driven Markdown and structured legal policies
//          with responsive Table of Contents and ATC design-system styling.
// ==============================================================================

import React, { useState } from 'react';
import { ChevronRight, FileText, Search, CheckCircle2 } from 'lucide-react';

interface DynamicPolicyRendererProps {
  content: string;
  policyTitle?: string;
  accentColor?: 'emerald' | 'blue' | 'indigo' | 'amber';
}

interface ParsedSection {
  id: string;
  title: string;
  badgeNumber: string;
  cleanTitle: string;
  paragraphs: string[];
}

export default function DynamicPolicyRenderer({
  content,
  policyTitle = 'Policy Details',
  accentColor = 'blue',
}: DynamicPolicyRendererProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Parse markdown-style sections (## Section Title)
  const parseSections = (raw: string): ParsedSection[] => {
    if (!raw) return [];

    const lines = raw.split('\n');
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection = {
      id: 'sec-intro',
      title: 'Introduction & Overview',
      badgeNumber: '1',
      cleanTitle: 'Introduction & Overview',
      paragraphs: [],
    };

    let sectionIdx = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        if (currentSection.paragraphs.length > 0 || currentSection.id !== 'sec-intro') {
          sections.push(currentSection);
        }
        const rawTitle = trimmed.replace(/^#{2,3}\s+/, '').trim();
        const numMatch = rawTitle.match(/^([0-9]+)\.?\s*(.*)$/);
        const badgeNumber = numMatch ? numMatch[1] : String(sectionIdx);
        const cleanTitle = numMatch && numMatch[2] ? numMatch[2].trim() : rawTitle;

        const id = `sec-${sectionIdx++}-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;
        currentSection = {
          id,
          title: rawTitle,
          badgeNumber,
          cleanTitle,
          paragraphs: [],
        };
      } else if (trimmed === '---' || trimmed === '***') {
        // Divider line, skip cleanly
      } else if (trimmed.length > 0) {
        currentSection.paragraphs.push(trimmed);
      }
    }

    if (currentSection.paragraphs.length > 0 || currentSection.title) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseSections(content);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Helper to format inline bold (**bold**) and bullet lists
  const renderParagraph = (text: string, pIdx: number) => {
    // Bullet item
    if (text.startsWith('- ') || text.startsWith('* ')) {
      const itemText = text.replace(/^[-*]\s+/, '');
      return (
        <li key={pIdx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 my-2 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
          <span className="leading-relaxed">{renderFormattedText(itemText)}</span>
        </li>
      );
    }

    // Callout box if uppercase warning
    const isWarningBox = text.startsWith('MANDATORY') || text.startsWith('THIS AGREEMENT CONTAINS') || text.startsWith('CUSTOMER EXPRESSLY ACKNOWLEDGES');
    if (isWarningBox) {
      return (
        <div key={pIdx} className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs sm:text-sm leading-relaxed font-medium">
          {renderFormattedText(text)}
        </div>
      );
    }

    return (
      <p key={pIdx} className="text-slate-700 dark:text-slate-300 leading-relaxed my-3 text-sm sm:text-base">
        {renderFormattedText(text)}
      </p>
    );
  };

  const renderFormattedText = (rawText: string) => {
    const parts = rawText.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const filteredSections = searchFilter.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          s.paragraphs.some((p) => p.toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : sections;

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* Sticky Sidebar Navigation */}
      {sections.length > 1 && (
        <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-center justify-between gap-2 mb-4 px-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Table of Contents
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {sections.length} Articles
            </span>
          </div>

          {/* Search inside policy */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search sections..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <nav className="space-y-1">
            {filteredSections.map((item) => {
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate pr-2">{item.title}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isSelected ? 'translate-x-0.5 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main Content Articles */}
      <div
        className={`${
          sections.length > 1 ? 'lg:col-span-8' : 'lg:col-span-12'
        } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed`}
      >
        {sections.map((sec) => (
          <section
            key={sec.id}
            id={sec.id}
            className="scroll-mt-24 space-y-3 pt-2 border-b border-slate-100 dark:border-slate-800/80 pb-10 last:border-b-0"
          >
            <div className="flex items-center gap-3.5 mb-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                {sec.badgeNumber}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-poppins">
                {sec.cleanTitle}
              </h2>
            </div>

            <div className="space-y-2 pl-0.5">
              {sec.paragraphs.map((para, pIdx) => renderParagraph(para, pIdx))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
