import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import ScriptContextMenu from './ScriptContextMenu';
import { useToast } from '../../context/ToastContext';
import { useScriptSave } from '../../context/ScriptSaveContext';
import useOpenAI from '../../hooks/useOpenAI';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { parseScriptToScenes, parseScriptToCharacters } from '../../utils/scriptHelpers';

export default function ScriptEditor({ script, setScript, scenes }) {
  const { currentProject, updateProject } = useProject();
  const { callOpenAI } = useOpenAI();
  const { triggerToast } = useToast();
  const { saveFunction } = useScriptSave();
  const textareaRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [promptInput, setPromptInput] = useState('Rewrite this to be better');
  const [currentScene, setCurrentScene] = useState(null);
  const [showSceneDropdown, setShowSceneDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchIndex, setSearchIndex] = useState(-1);
  const [searchMatches, setSearchMatches] = useState([]);

  // Add undo/redo history
  const [history, setHistory] = useState([typeof script === 'string' ? script : script?.content || '']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Normalize script to string
  const scriptContent = typeof script === 'string' ? script : script?.content || '';

  // Save current state to history
  const saveToHistory = (newScript) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newScript);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setScript(history[newIndex]);
      triggerToast('Undo', 'info');
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setScript(history[newIndex]);
      triggerToast('Redo', 'info');
    }
  };

  // Quick save function
  const quickSave = useCallback(() => {
    if (currentProject && saveFunction) {
      saveFunction();
    }
  }, [currentProject, saveFunction]);

  // Search function
  const findNext = () => {
    if (!searchTerm) return;

    const text = scriptContent.toLowerCase();
    const search = searchTerm.toLowerCase();
    let nextIndex = -1;

    if (searchIndex === -1) {
      nextIndex = text.indexOf(search);
    } else {
      nextIndex = text.indexOf(search, searchIndex + 1);
      if (nextIndex === -1) {
        nextIndex = text.indexOf(search); // Wrap around to start
      }
    }

    if (nextIndex !== -1) {
      setSearchIndex(nextIndex);
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(nextIndex, nextIndex + searchTerm.length);
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Find all matches
  const findAllMatches = () => {
    if (!searchTerm) return [];
    const regex = new RegExp(searchTerm, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(scriptContent)) !== null) {
      matches.push(match.index);
    }
    return matches;
  };

  // Update search matches when search term changes
  useEffect(() => {
    if (searchTerm) {
      setSearchMatches(findAllMatches());
      setSearchIndex(-1);
    } else {
      setSearchMatches([]);
      setSearchIndex(-1);
    }
  }, [searchTerm, scriptContent]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            quickSave();
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            break;
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
        }
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickSave, undo, redo]);

  // Save to history when script changes
  useEffect(() => {
    if (scriptContent !== history[historyIndex]) {
      saveToHistory(scriptContent);
    }
  }, [scriptContent]);

  // Function to find scene markers in the script
  const findSceneMarkers = (text) => {
    const markers = [];
    const regex = /\[SCENE: (.*?)\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      markers.push({
        sceneName: match[1],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return markers;
  };

  // Get unique scene names from both props and script markers
  const getAvailableScenes = () => {
    const scriptScenes = findSceneMarkers(scriptContent).map((m) => m.sceneName);
    const propScenes = scenes.map((s) => s.name);
    return [...new Set([...scriptScenes, ...propScenes])];
  };

  // Function to jump to a specific scene in the script
  const jumpToScene = (sceneName) => {
    const markers = findSceneMarkers(scriptContent);
    const marker = markers.find((m) => m.sceneName === sceneName);
    if (marker && textareaRef.current) {
      const textarea = textareaRef.current;

      textarea.focus();
      textarea.setSelectionRange(marker.start, marker.end);

      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const linesBeforeMarker = scriptContent.substring(0, marker.start).split('\n').length;
      const scrollTop = linesBeforeMarker * lineHeight - textarea.clientHeight / 2;

      textarea.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });

      setCurrentScene(sceneName);
    }
  };

  // Function to insert a scene marker
  const insertSceneMarker = (sceneName) => {
    const marker = `[SCENE: ${sceneName}]`;
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    const newScript = scriptContent.substring(0, cursorPos) + marker + '\n\n' + scriptContent.substring(cursorPos);
    setScript(newScript);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + marker.length + 2, cursorPos + marker.length + 2);
    }, 0);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const formattedContent = formatImportedScript(content);
      setScript(formattedContent);
      saveToHistory(formattedContent);
      e.target.value = '';

      // Parse and save characters first
      try {
        console.log('Parsing imported script:', formattedContent);
        const parsedCharacters = parseScriptToCharacters(formattedContent);
        console.log('Parsed characters:', JSON.stringify(parsedCharacters, null, 2));

        // Update project with characters
        const existingCharacters = currentProject?.characters || [];
        const existingCharacterNames = new Set(existingCharacters.map((c) => c.name.toLowerCase()));
        const newCharacters = parsedCharacters.filter(
          (c) => !existingCharacterNames.has(c.name.toLowerCase())
        );
        const updatedCharacters = [...existingCharacters, ...newCharacters];

        console.log('Saving characters:', JSON.stringify(updatedCharacters, null, 2));
        const characterUpdate = await updateProject({
          characters: updatedCharacters,
        });
        console.log('Characters saved, updated project:', JSON.stringify(characterUpdate, null, 2));

        // Parse scenes with saved characters
        const savedCharacters = characterUpdate.characters || updatedCharacters;
        const parsedScenes = parseScriptToScenes(formattedContent, savedCharacters);
        console.log('Parsed scenes with saved characters:', JSON.stringify(parsedScenes, null, 2));

        if (parsedScenes.some((s) => s.dialogues?.length > 0)) {
          console.log('Dialogues found in parsed scenes');
        } else {
          console.warn('No dialogues found in parsed scenes');
        }

        // Update project with scenes and script
        await updateProject({
          scenes: parsedScenes,
          script: {
            content: formattedContent,
            wordCount: formattedContent.trim().split(/\s+/).filter(Boolean).length,
          },
        });

        console.log('Updated project with scenes and script');
        triggerToast('Script imported successfully', 'success');
      } catch (error) {
        console.error('Error importing script:', error);
        triggerToast(`Failed to import script: ${error.message}`, 'error');
      }

      setShowSceneDropdown((prev) => !prev);
    };
    reader.readAsText(file);
  };

  const formatImportedScript = (text) => {
    const existingScenes = [];
    const sceneMarkerRegex = /^\[SCENE: (.*?)\]/gm;
    let match;
    while ((match = sceneMarkerRegex.exec(text)) !== null) {
      existingScenes.push({
        marker: match[0],
        index: match.index,
      });
    }

    let formattedText = text.replace(/^\[SCENE:.*?\]/gm, '');

    const scenePatterns = [
      /^Scene (\d+)(?: –|:)? (.*?)$/gm,
      /^SCENE (\d+)(?: –|:)? (.*?)$/gm,
      /^INT\. (.*?)$/gm,
      /^EXT\. (.*?)$/gm,
      /^INT\.\/EXT\. (.*?)$/gm,
    ];

    scenePatterns.forEach((pattern) => {
      formattedText = formattedText.replace(pattern, (match, sceneNum, sceneName) => {
        const name = String(sceneName || sceneNum || match || '').trim();
        const cleanName = name.replace(/\[SCENE: |\]/g, '');
        if (cleanName && !cleanName.includes('[SCENE:') && !/^\d+$/.test(cleanName)) {
          return `\n\n[SCENE: ${cleanName}]\n\n`;
        }
        return match;
      });
    });

    existingScenes.forEach((scene) => {
      const before = formattedText.substring(0, scene.index);
      const after = formattedText.substring(scene.index);
      formattedText = before + scene.marker + after;
    });

    formattedText = formattedText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');

    return formattedText;
  };

  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const handleExport = async (format) => {
    if (!scriptContent) {
      triggerToast('No script to export', 'error');
      return;
    }

    try {
      switch (format) {
        case 'txt':
          exportAsTxt();
          break;
        case 'pdf':
          await exportAsPdf();
          break;
        case 'docx':
          await exportAsDocx();
          break;
        default:
          triggerToast('Invalid export format', 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      triggerToast('Export failed', 'error');
    }
  };

  const exportAsTxt = () => {
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject?.title || 'script'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Exported as TXT', 'success');
  };

  const exportAsPdf = async () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text(currentProject?.title || 'Script', 20, 20);

      doc.setFontSize(12);
      const lines = doc.splitTextToSize(scriptContent, 170);
      let y = 40;

      lines.forEach((line) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      });

      doc.save(`${currentProject?.title || 'script'}.pdf`);
      triggerToast('Exported as PDF', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      triggerToast('PDF export failed', 'error');
    }
  };

  const exportAsDocx = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: currentProject?.title || 'Script',
                    bold: true,
                    size: 32,
                  }),
                ],
                spacing: {
                  after: 200,
                },
              }),
              ...scriptContent
                .split('\n')
                .map(
                  (line) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: line,
                          size: 16,
                        }),
                      ],
                      spacing: {
                        after: 100,
                      },
                    })
                ),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject?.title || 'script'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast('Exported as DOCX', 'success');
    } catch (error) {
      console.error('DOCX export error:', error);
      triggerToast('DOCX export failed', 'error');
    }
  };

  const wordCount = scriptContent.trim().split(/\s+/).filter(Boolean).length;

  const handleContextMenu = (e) => {
    e.preventDefault();
    const textarea = textareaRef.current;
    const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    if (!selection.trim()) return;

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      text: selection,
    });
    setPromptInput('Rewrite this to be better');
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleSendToAI = async () => {
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;
    const prompt = `${promptInput.trim()}:\n\n${contextMenu.text}`;
    const aiResponse = await callOpenAI(prompt);

    if (aiResponse) {
      const updated = scriptContent.substring(0, selectionStart) + aiResponse + scriptContent.substring(selectionEnd);
      setScript(updated);
      closeContextMenu();
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSceneDropdown(false);
      setShowExportDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const adjustTextareaHeight = (textarea) => {
    const scrollTop = textarea.scrollTop;
    const cursorPosition = textarea.selectionStart;

    const visibleHeight = textarea.clientHeight;
    const cursorTop = (cursorPosition / textarea.value.length) * textarea.scrollHeight;
    const cursorBottom = cursorTop + parseInt(getComputedStyle(textarea).lineHeight);

    const shouldAdjust = cursorBottom > visibleHeight - 50;

    const newHeight = Math.max(textarea.scrollHeight, 500);
    if (Math.abs(parseInt(textarea.style.height) - newHeight) > 20) {
      textarea.style.height = newHeight + 'px';

      if (shouldAdjust) {
        textarea.scrollTop = textarea.scrollHeight - visibleHeight;
      } else {
        textarea.scrollTop = scrollTop;
      }
    }

    textarea.setSelectionRange(cursorPosition, cursorPosition);
  };

  return (
    <div onClick={closeContextMenu}>
      <div className="d-flex justify-content-between align-items-center mb-2 px-1">
        <div className="d-flex align-items-center gap-3">
          <p className="mb-0 fw-600 opacity-50 ms-1">Script Editor</p>
          {currentScene && (
            <span className="badge cp-bg-darker cp-text-green">{currentScene}</span>
          )}
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="position-relative">
            <button
              className="btn cp-btn-dark cp-green btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowSceneDropdown(!showSceneDropdown);
              }}
            >
              Jump to Scene
            </button>
            {showSceneDropdown && (
              <div
                className="position-absolute cp-bg-dark cp-rounded p-2 mt-1"
                style={{ minWidth: '200px', zIndex: 1000 }}
                onClick={(e) => e.stopPropagation()}
              >
                {getAvailableScenes().map((sceneName) => (
                  <button
                    key={sceneName}
                    className="btn btn-sm w-100 text-start text-white cp-hover-bg-darker"
                    onClick={() => {
                      jumpToScene(sceneName);
                      setShowSceneDropdown(false);
                    }}
                  >
                    {sceneName}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="fw-600">
            <span className="opacity-50">Word Count:</span>{' '}
            <span className="cp-text-green fw-bold">{wordCount}</span>
          </span>
        </div>
      </div>

      {showSearch && (
        <div className="d-flex align-items-center gap-2 mb-2">
          <input
            type="text"
            className="form-control form-control-sm cp-bg-darker cp-rounded-sm text-white border-0"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <button
            className="btn cp-btn-dark cp-green btn-sm nowrap"
            onClick={findNext}
            disabled={!searchTerm}
          >
            Find
          </button>
          {searchMatches.length > 0 && (
            <span className="text-white opacity-50 nowrap">
              {searchIndex + 1} of {searchMatches.length}
            </span>
          )}
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="form-control text-white border-0 w-100 cp-rounded p-4 fw-600"
        style={{
          height: 'auto',
          minHeight: '500px',
          maxHeight: '80vh',
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          resize: 'none',
          overflowY: 'auto',
        }}
        placeholder="In a land far, far away..."
        value={scriptContent}
        onChange={(e) => {
          const textarea = e.target;
          setScript(textarea.value);
          setTimeout(() => adjustTextareaHeight(textarea), 0);
        }}
        onContextMenu={handleContextMenu}
        rows={1}
      ></textarea>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex gap-2">
          <button
            className="btn cp-btn-dark cp-green btn-sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl/Cmd + Z)"
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>Undo
          </button>
          <button
            className="btn cp-btn-dark cp-green btn-sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl/Cmd + Y)"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>Redo
          </button>
        </div>
        <div className="d-flex gap-2">
          <label
            className="btn cp-btn-dark cp-green mb-0 btn-sm"
            title="Import text file (.txt)"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="bi bi-file-earmark-text me-2 cp-text-green"></i> Import
            <input
              type="file"
              accept=".txt"
              onChange={handleImport}
              onClick={(e) => e.stopPropagation()}
              hidden
            />
          </label>
          <a
            href="/sample-format.txt"
            className="btn cp-btn-dark cp-green btn-sm"
            target="_blank"
            rel="noopener noreferrer"
            title="View sample format"
          >
            <i className="bi bi-question-circle me-2 cp-text-green"></i> Sample Format
          </a>
          <div className="position-relative">
            <button
              className="btn cp-btn-dark cp-green btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowExportDropdown(!showExportDropdown);
              }}
              title="Export options"
            >
              <i className="bi bi-download me-2 cp-text-green"></i> Export
            </button>
            {showExportDropdown && (
              <div
                className="position-absolute cp-bg-dark cp-rounded p-2 mt-1"
                style={{
                  minWidth: '200px',
                  zIndex: 1000,
                  right: 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn btn-sm w-100 text-start text-white cp-hover-bg-darker"
                  onClick={() => {
                    handleExport('txt');
                    setShowExportDropdown(false);
                  }}
                >
                  Export as TXT
                </button>
                <button
                  className="btn btn-sm w-100 text-start text-white cp-hover-bg-darker"
                  onClick={() => {
                    handleExport('pdf');
                    setShowExportDropdown(false);
                  }}
                >
                  Export as PDF
                </button>
                <button
                  className="btn btn-sm w-100 text-start text-white cp-hover-bg-darker"
                  onClick={() => {
                    handleExport('docx');
                    setShowExportDropdown(false);
                  }}
                >
                  Export as DOCX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {contextMenu.visible && (
        <ScriptContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedText={contextMenu.text}
          promptInput={promptInput}
          setPromptInput={setPromptInput}
          onSendToAI={handleSendToAI}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}