<?php

namespace Tests\Unit\Support;

use App\Models\DiscoveryNode;
use App\Support\TreeBuilder;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

/**
 * Deterministic unit tests for the centralized IVR tree builder.
 *
 * Uses unsaved (forceFill'd) Eloquent instances so the test needs no database.
 *
 * Pipeline run: 20260611T131110_0vf8xp
 * Covers code-gen finding AC-B04 (de-duplicated buildTree).
 */
class TreeBuilderTest extends TestCase
{
    private TreeBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->builder = new TreeBuilder();
    }

    private function node(int $id, ?int $parentId, string $prompt = 'p', ?string $dtmf = null, string $type = 'menu', int $depth = 0): DiscoveryNode
    {
        return (new DiscoveryNode())->forceFill([
            'id' => $id,
            'parent_id' => $parentId,
            'prompt_text' => $prompt,
            'dtmf_option' => $dtmf,
            'node_type' => $type,
            'depth' => $depth,
        ]);
    }

    public function test_empty_collection_returns_empty_array(): void
    {
        $this->assertSame([], $this->builder->build(new Collection()));
    }

    public function test_flat_roots_have_empty_children(): void
    {
        $nodes = collect([
            $this->node(1, null, 'root A'),
            $this->node(2, null, 'root B'),
        ]);

        $tree = $this->builder->build($nodes);

        $this->assertCount(2, $tree);
        $this->assertSame('root A', $tree[0]['prompt_text']);
        $this->assertSame([], $tree[0]['children']);
        $this->assertSame([], $tree[1]['children']);
    }

    public function test_nests_children_under_parent(): void
    {
        $nodes = collect([
            $this->node(1, null, 'root'),
            $this->node(2, 1, 'child', '1', 'menu', 1),
            $this->node(3, 2, 'grandchild', '1', 'leaf', 2),
        ]);

        $tree = $this->builder->build($nodes);

        $this->assertCount(1, $tree);
        $this->assertSame(1, $tree[0]['id']);
        $this->assertCount(1, $tree[0]['children']);

        $child = $tree[0]['children'][0];
        $this->assertSame(2, $child['id']);
        $this->assertSame('1', $child['dtmf_option']);
        $this->assertCount(1, $child['children']);
        $this->assertSame(3, $child['children'][0]['id']);
        $this->assertSame([], $child['children'][0]['children']);
    }

    public function test_multiple_children_preserved_and_reindexed(): void
    {
        $nodes = collect([
            $this->node(1, null, 'root'),
            $this->node(10, 1, 'opt 1', '1'),
            $this->node(11, 1, 'opt 2', '2'),
        ]);

        $tree = $this->builder->build($nodes);
        $children = $tree[0]['children'];

        $this->assertCount(2, $children);
        // values() must produce a sequential 0-based array.
        $this->assertArrayHasKey(0, $children);
        $this->assertArrayHasKey(1, $children);
        $this->assertSame([10, 11], array_column($children, 'id'));
    }

    public function test_orphan_nodes_are_excluded_from_root(): void
    {
        // A node whose parent_id points nowhere should not surface as a root.
        $nodes = collect([
            $this->node(1, null, 'root'),
            $this->node(2, 999, 'orphan'),
        ]);

        $tree = $this->builder->build($nodes);

        $this->assertCount(1, $tree);
        $this->assertSame(1, $tree[0]['id']);
    }

    public function test_only_whitelisted_keys_are_exposed(): void
    {
        $nodes = collect([$this->node(1, null, 'root')]);

        $tree = $this->builder->build($nodes);

        $this->assertSame(
            ['id', 'prompt_text', 'dtmf_option', 'node_type', 'depth', 'children'],
            array_keys($tree[0])
        );
    }
}
