const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const Category = require('../src/models/Category');

// Mock cache for testing
jest.mock('../src/config/cache', () => {
  const store = {};
  return {
    get: jest.fn((key) => store[key] || undefined),
    set: jest.fn((key, value) => { store[key] = value; }),
    del: jest.fn((key) => { delete store[key]; }),
    keys: jest.fn(() => Object.keys(store)),
    on: jest.fn(),
  };
});

const CategoryTree = require('../src/utils/categoryTree');

describe('Category DFS + Caching', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
    CategoryTree.invalidateCache();
  });

  it('should build category tree using DFS', async () => {
    const root = await Category.create({ name: 'Electronics' });
    const phones = await Category.create({ name: 'Phones', parent: root._id });
    const laptops = await Category.create({ name: 'Laptops', parent: root._id });
    const android = await Category.create({ name: 'Android', parent: phones._id });
    const ios = await Category.create({ name: 'iOS', parent: phones._id });

    const tree = await CategoryTree.buildTree();

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('Electronics');
    expect(tree[0].children).toHaveLength(2);
  });

  it('should find all descendants using DFS', async () => {
    const root = await Category.create({ name: 'Root' });
    const child1 = await Category.create({ name: 'Child 1', parent: root._id });
    const child2 = await Category.create({ name: 'Child 2', parent: root._id });
    const grandchild = await Category.create({ name: 'Grandchild', parent: child1._id });

    const descendants = await CategoryTree.getDescendantIds(root._id.toString());

    expect(descendants).toHaveLength(4); // root + child1 + child2 + grandchild
    expect(descendants).toContain(root._id.toString());
    expect(descendants).toContain(child1._id.toString());
    expect(descendants).toContain(grandchild._id.toString());
  });

  it('should get ancestors path', async () => {
    const root = await Category.create({ name: 'Root' });
    const child = await Category.create({ name: 'Child', parent: root._id });
    const grandchild = await Category.create({ name: 'Grandchild', parent: child._id });

    const ancestors = await CategoryTree.getAncestors(grandchild._id.toString());

    expect(ancestors).toHaveLength(3);
    expect(ancestors[0].name).toBe('Root');
    expect(ancestors[2].name).toBe('Grandchild');
  });

  it('should handle empty category tree', async () => {
    const tree = await CategoryTree.buildTree();
    expect(tree).toHaveLength(0);
  });
});
