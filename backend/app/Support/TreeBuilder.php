<?php

namespace App\Support;

use App\Models\DiscoveryNode;
use Illuminate\Support\Collection;

/**
 * Single source of truth for building the IVR node tree.
 *
 * Replaces the copy-pasted buildTree() implementations previously duplicated in
 * DiscoveryController and LegacyReportController.
 */
class TreeBuilder
{
    /**
     * Build a nested tree from a flat collection of discovery nodes.
     *
     * @param  Collection<int, DiscoveryNode>  $nodes
     * @return array<int, array<string, mixed>>
     */
    public function build(Collection $nodes, ?int $parentId = null): array
    {
        return $nodes
            ->where('parent_id', $parentId)
            ->map(fn (DiscoveryNode $node): array => [
                'id' => $node->id,
                'prompt_text' => $node->prompt_text,
                'dtmf_option' => $node->dtmf_option,
                'node_type' => $node->node_type,
                'depth' => $node->depth,
                'children' => $this->build($nodes, $node->id),
            ])
            ->values()
            ->all();
    }
}
