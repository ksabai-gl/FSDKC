import type { DiscoveryNode } from '../types';

interface Props {
  nodes: DiscoveryNode[];
}

export default function IvrTree({ nodes }: Props) {
  return (
    <div className="tree-view">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  );
}

function TreeNode({ node }: { node: DiscoveryNode }) {
  return (
    <div className="tree-node">
      <div>
        {node.dtmf_option && (
          <span style={{ color: 'var(--accent-2)', marginRight: '0.5rem' }}>
            [{node.dtmf_option}]
          </span>
        )}
        <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{node.node_type}</span>
      </div>
      <div style={{ marginTop: '0.25rem' }}>{node.prompt_text}</div>
      {node.children?.map((child) => (
        <TreeNode key={child.id} node={child} />
      ))}
    </div>
  );
}
