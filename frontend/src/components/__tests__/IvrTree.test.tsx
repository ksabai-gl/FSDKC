import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IvrTree from '../IvrTree';
import type { DiscoveryNode } from '../../types';

describe('IvrTree', () => {
  const mockNodes: DiscoveryNode[] = [
    {
      id: 1,
      prompt_text: 'Welcome to support. Press 1 for billing.',
      dtmf_option: null,
      node_type: 'root',
      depth: 0,
      children: [
        {
          id: 2,
          prompt_text: 'For account balance, press 1.',
          dtmf_option: '1',
          node_type: 'menu',
          depth: 1,
          children: [],
        },
        {
          id: 3,
          prompt_text: 'For recent transactions, press 2.',
          dtmf_option: '2',
          node_type: 'menu',
          depth: 1,
          children: [],
        },
      ],
    },
  ];

  describe('rendering', () => {
    it('renders the tree container', () => {
      render(<IvrTree nodes={mockNodes} />);
      expect(document.querySelector('.tree-view')).toBeInTheDocument();
    });

    it('renders root node prompt text', () => {
      render(<IvrTree nodes={mockNodes} />);
      expect(screen.getByText('Welcome to support. Press 1 for billing.')).toBeInTheDocument();
    });

    it('renders child nodes', () => {
      render(<IvrTree nodes={mockNodes} />);
      expect(screen.getByText('For account balance, press 1.')).toBeInTheDocument();
      expect(screen.getByText('For recent transactions, press 2.')).toBeInTheDocument();
    });

    it('renders DTMF options in brackets', () => {
      render(<IvrTree nodes={mockNodes} />);
      expect(screen.getByText('[1]')).toBeInTheDocument();
      expect(screen.getByText('[2]')).toBeInTheDocument();
    });

    it('renders node type labels', () => {
      render(<IvrTree nodes={mockNodes} />);
      expect(screen.getByText('root')).toBeInTheDocument();
      const menuLabels = screen.getAllByText('menu');
      expect(menuLabels).toHaveLength(2);
    });

    it('does not render DTMF bracket for null dtmf_option', () => {
      render(<IvrTree nodes={mockNodes} />);
      const brackets = screen.queryAllByText(/^\[.*\]$/);
      expect(brackets).toHaveLength(2);
    });
  });

  describe('empty state', () => {
    it('renders empty tree-view for empty nodes array', () => {
      render(<IvrTree nodes={[]} />);
      const treeView = document.querySelector('.tree-view');
      expect(treeView).toBeInTheDocument();
      expect(treeView?.children).toHaveLength(0);
    });
  });

  describe('nested structure', () => {
    it('renders deeply nested nodes', () => {
      const deepNodes: DiscoveryNode[] = [
        {
          id: 1,
          prompt_text: 'Level 0',
          dtmf_option: null,
          node_type: 'root',
          depth: 0,
          children: [
            {
              id: 2,
              prompt_text: 'Level 1',
              dtmf_option: '1',
              node_type: 'menu',
              depth: 1,
              children: [
                {
                  id: 3,
                  prompt_text: 'Level 2',
                  dtmf_option: '2',
                  node_type: 'endpoint',
                  depth: 2,
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      render(<IvrTree nodes={deepNodes} />);

      expect(screen.getByText('Level 0')).toBeInTheDocument();
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
    });
  });

  describe('multiple root nodes', () => {
    it('renders multiple root nodes', () => {
      const multipleRoots: DiscoveryNode[] = [
        {
          id: 1,
          prompt_text: 'First root',
          dtmf_option: null,
          node_type: 'root',
          depth: 0,
        },
        {
          id: 2,
          prompt_text: 'Second root',
          dtmf_option: null,
          node_type: 'root',
          depth: 0,
        },
      ];

      render(<IvrTree nodes={multipleRoots} />);

      expect(screen.getByText('First root')).toBeInTheDocument();
      expect(screen.getByText('Second root')).toBeInTheDocument();
    });
  });
});
