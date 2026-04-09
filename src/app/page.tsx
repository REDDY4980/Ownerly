'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Loader2, Sparkles, Server, CheckCircle, Mail, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    maxSteps: 5, // Important: Allows the model to call multiple tools sequentially
  });
  
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of the console
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status]);

  // Extract the latest drafted email and resolved identities if present
  let draftedEmail: Record<string, string> | null = null;
  let resolvedTeam: Record<string, any> | null = null;
  
  messages.forEach(m => {
    if (m.toolInvocations) {
      m.toolInvocations.forEach(t => {
        if (t.toolName === 'draftEmail' && t.state === 'result') {
          draftedEmail = t.result;
        }
        if (t.toolName === 'resolveIdentity' && t.state === 'result' && !t.result.error) {
          resolvedTeam = t.result;
        }
      });
    }
  });

  const isComplete = draftedEmail && status !== 'submitted' && status !== 'streaming';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-mono flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-4xl w-full bg-black/60 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex space-x-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <Terminal size={16} className="text-emerald-500 mr-2" />
          <h1 className="text-sm font-semibold tracking-wide text-zinc-400">Antigravity: Agentic AI Console</h1>
        </div>

        <div className="flex flex-col md:flex-row h-[70vh] max-h-[800px]">
          
          {/* Main Terminal Area */}
          <div className="flex-1 flex flex-col relative border-r border-zinc-800/50">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <AnimatePresence>
                {messages.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4"
                  >
                    <Sparkles className="w-12 h-12 text-zinc-700" />
                    <p className="text-sm text-center max-w-md leading-relaxed">
                      Initialize Antigravity Protocol.<br/>
                      Provide a business directive to resolve identities and dispatch communications.
                    </p>
                    <div className="text-xs bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                      Try: "Email Team 1 about the Q3 server migration and request their logs"
                    </div>
                  </motion.div>
                )}

                {messages.map((m, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={m.id} 
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {m.role === 'user' ? (
                      <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 px-4 py-3 rounded-lg max-w-[85%] sm:max-w-[75%]">
                        <span className="text-xs text-emerald-600/80 uppercase font-bold tracking-wider block mb-1">Directive</span>
                        {m.content}
                      </div>
                    ) : (
                      <div className="w-full space-y-4">
                        {/* Streamed text response from the agent */}
                        {m.content && (
                          <div className="text-zinc-400 pl-4 border-l-2 border-zinc-800 py-1">
                            <span className="text-xs text-zinc-600 uppercase font-bold tracking-wider block mb-1">Agent Response</span>
                            {m.content}
                          </div>
                        )}
                        
                        {/* Tool Invocations (Agent's Thoughts) */}
                        {m.toolInvocations?.map((toolInv, tIdx) => (
                          <div key={toolInv.toolCallId} className="pl-4 border-l-2 border-zinc-700/50 py-2 w-full max-w-2xl text-sm">
                            <div className="flex items-center space-x-2 text-zinc-500 mb-2">
                              {toolInv.state === 'result' ? (
                                <CheckCircle size={14} className="text-emerald-500" />
                              ) : (
                                <Loader2 size={14} className="text-emerald-500 animate-spin" />
                              )}
                              <span className="uppercase text-xs font-semibold text-emerald-500/80">
                                {toolInv.state === 'result' ? 'System executed' : 'Agent executing'}: {toolInv.toolName}
                              </span>
                            </div>
                            
                            <div className="bg-black border border-zinc-800 rounded-md p-3 overflow-x-auto text-xs text-zinc-400 font-mono shadow-inner">
                             <div className="mb-2">
                               <span className="text-zinc-500 select-none">ARGS &gt; </span>
                               <span className="text-yellow-200/70">{JSON.stringify(toolInv.args)}</span>
                             </div>
                             {toolInv.state === 'result' && (
                               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                  <span className="text-zinc-500 select-none">RES  &lt; </span>
                                  {toolInv.toolName === 'resolveIdentity' ? (
                                    <span className="text-emerald-400/80">Found {toolInv.result?.recipients?.length || 0} relative entities.</span>
                                  ) : toolInv.toolName === 'draftEmail' ? (
                                    <span className="text-emerald-400/80">Draft constructed successfully.</span>
                                  ) : (
                                    <span className="text-zinc-300">{JSON.stringify(toolInv.result)}</span>
                                  )}
                               </motion.div>
                             )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {status === 'streaming' && !messages.find(m => m.role === 'assistant' && m.content === '')?.toolInvocations?.length && (
                   <div className="pl-4 border-l-2 border-zinc-800 py-1">
                     <span className="flex items-center space-x-2 text-emerald-500/70 text-xs uppercase font-bold tracking-wider">
                       <Loader2 size={12} className="animate-spin" />
                       <span>Processing...</span>
                     </span>
                   </div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} className="h-4" />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-zinc-950/80 border-t border-zinc-800">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <span className="absolute left-4 text-emerald-500 font-bold select-none">&gt;</span>
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Enter business directive..."
                  disabled={status === 'submitted' || status === 'streaming'}
                  className="w-full bg-black/50 text-emerald-50 border border-zinc-800 rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono text-sm disabled:opacity-50"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || status === 'submitted' || status === 'streaming'}
                  className="absolute right-3 p-1.5 text-zinc-500 hover:text-emerald-400 disabled:opacity-40 disabled:hover:text-zinc-500 transition-colors bg-zinc-900 rounded-md border border-zinc-800"
                >
                  {status === 'submitted' || status === 'streaming' ? (
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Side Panel: Success Card / Data View */}
          <div className="w-full md:w-[350px] bg-[#0c0c0c] flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center text-xs font-semibold text-zinc-500 uppercase tracking-widest bg-zinc-950">
              <Server size={14} className="mr-2" />
              Runtime Outputs
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {resolvedTeam ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111] border border-zinc-800 rounded-lg p-4 shadow-lg"
                >
                  <div className="flex items-center text-xs text-zinc-400 mb-3 border-b border-zinc-800 pb-2">
                    <User size={14} className="mr-2 text-indigo-400" />
                    <span className="uppercase tracking-wider font-bold">Identity Module</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-zinc-500 text-xs">Target:</span>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-xs border border-indigo-500/20">{resolvedTeam.team}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {resolvedTeam.recipients?.map((r: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-black/50 px-2 py-1.5 rounded border border-zinc-800/50">
                          <span className="text-zinc-300 text-sm truncate">{r.name}</span>
                          <span className="text-zinc-500 text-xs truncate ml-2">{r.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="border border-dashed border-zinc-800 rounded-lg p-4 text-center text-zinc-600 text-xs flex flex-col items-center justify-center h-24">
                  <User size={16} className="mb-2 opacity-50" />
                  No identities resolved yet.
                </div>
              )}

              {draftedEmail ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111] border border-emerald-900/30 rounded-lg p-0 shadow-lg overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-3 border-b border-zinc-800 bg-emerald-950/10 flex flex-col">
                    <div className="flex items-center text-xs text-emerald-500 mb-2 font-bold uppercase tracking-wider">
                      <Mail size={14} className="mr-2" />
                      Email Synthesized
                    </div>
                    <div className="flex space-x-2 text-sm mt-1">
                      <span className="text-zinc-600">Subj:</span>
                      <span className="text-zinc-200 font-semibold truncate">{draftedEmail.subject}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-black/40 text-sm text-zinc-400 whitespace-pre-wrap flex-1 max-h-[300px] overflow-y-auto">
                    {draftedEmail.body}
                  </div>
                </motion.div>
              ) : (
                <div className="border border-dashed border-zinc-800 rounded-lg p-4 text-center text-zinc-600 text-xs flex flex-col items-center justify-center h-24">
                  <Mail size={16} className="mb-2 opacity-50" />
                  No drafts generated.
                </div>
              )}
              
              {isComplete && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => alert('🚀 Dispatching to Mailjet/SMTP in production!')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center transform active:scale-[0.98]"
                >
                  <Send size={16} className="mr-2" />
                  DISPATCH EMAIL
                </motion.button>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
