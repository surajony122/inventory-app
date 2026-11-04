import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

// Shopify names app-owned metaobject types "app--<app id>--<type>" in the Storefront API.
const TYPE = 'app--351448498177--checkout_block';

const QUERY = `query ($type: String!) {
  metaobjects(type: $type, first: 50) {
    nodes { fields { key value } }
  }
}`;

const PRODUCT_QUERY = `query ($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Product { tags collections(first: 25) { nodes { handle } } }
  }
}`;

export default async () => {
  render(<Extension />, document.body);
};

function parse(node) {
  const f = Object.fromEntries(node.fields.map((x) => [x.key, x.value]));
  return {
    kind: f.kind,
    title: f.title || '',
    body: f.body || '',
    code: f.code || '',
    active: f.active === 'true',
    sort: Number(f.sort) || 0,
    condType: f.cond_type || 'always',
    condValue: f.cond_value || '',
  };
}

function Extension() {
  const [blocks, setBlocks] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [facts, setFacts] = useState({tags: [], handles: [], ready: false});

  // Tags and collections of the products currently in the cart, for conditional blocks.
  const productIds = [...new Set(shopify.lines.value.map((l) => l.merchandise?.product?.id).filter(Boolean))];
  const idsKey = productIds.join(',');
  const needsFacts = blocks.some((b) => b.condType !== 'always');

  useEffect(() => {
    shopify
      .query(QUERY, {variables: {type: TYPE}})
      .then(({data, errors}) => {
        if (errors?.length) setLoadError(errors[0].message);
        const all = (data?.metaobjects?.nodes || []).map(parse);
        setBlocks(all.filter((b) => b.active && b.kind === 'note').sort((a, b) => a.sort - b.sort));
        setLoaded(true);
      })
      .catch((e) => {
        setLoadError(String(e?.message || e));
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!needsFacts) return;
    if (productIds.length === 0) {
      setFacts({tags: [], handles: [], ready: true});
      return;
    }
    shopify
      .query(PRODUCT_QUERY, {variables: {ids: productIds}})
      .then(({data}) => {
        const tags = [];
        const handles = [];
        (data?.nodes || []).forEach((n) => {
          (n?.tags || []).forEach((t) => tags.push(String(t).toLowerCase()));
          (n?.collections?.nodes || []).forEach((c) => handles.push(String(c.handle).toLowerCase()));
        });
        setFacts({tags, handles, ready: true});
      })
      .catch(() => setFacts({tags: [], handles: [], ready: true}));
  }, [idsKey, needsFacts]);

  const matches = (b) => {
    if (b.condType === 'always') return true;
    if (!facts.ready) return false;
    const wanted = b.condValue.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    const have = b.condType === 'tag' ? facts.tags : facts.handles;
    return wanted.some((w) => have.includes(w));
  };
  const visible = blocks.filter(matches);
  const notes = visible.filter((b) => b.kind === 'note');

  if (blocks.length === 0) {
    // Only the merchant sees this, inside the checkout editor.
    if (loaded && shopify.extension.editor) {
      return (
        <s-banner tone="warning" heading="Checkout Blocks">
          {loadError
            ? 'Could not load blocks: ' + loadError
            : 'No active notes were found. Add them in the team portal under Checkout Blocks.'}
        </s-banner>
      );
    }
    return null;
  }

  return (
    <s-stack gap="base">
      {notes.map((b) => (
        <s-box key={b.title + b.body} border="base" borderRadius="large" padding="base">
          <s-stack gap="small-300">
            <s-heading>{b.title}</s-heading>
            <s-text>{b.body}</s-text>
          </s-stack>
        </s-box>
      ))}
    </s-stack>
  );
}
