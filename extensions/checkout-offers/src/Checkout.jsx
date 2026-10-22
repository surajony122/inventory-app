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
  };
}

function Extension() {
  const [blocks, setBlocks] = useState([]);
  const [busyCode, setBusyCode] = useState(null);
  const [error, setError] = useState('');

  // The reductions target shows coupons; the block target shows notes.
  const wanted = shopify.extension.target === 'purchase.checkout.reductions.render-after' ? 'coupon' : 'note';

  useEffect(() => {
    shopify
      .query(QUERY, {variables: {type: TYPE}})
      .then(({data}) => {
        const list = (data?.metaobjects?.nodes || [])
          .map(parse)
          .filter((b) => b.active && b.kind === wanted)
          .sort((a, b) => a.sort - b.sort);
        setBlocks(list);
      })
      .catch(() => setBlocks([]));
  }, []);

  if (blocks.length === 0) return null;

  const settings = shopify.settings.value;
  const max = Number(settings.max_coupons);
  const shown = wanted === 'coupon' && max > 0 ? blocks.slice(0, max) : blocks;

  if (wanted === 'note') {
    return (
      <s-stack gap="base">
        {shown.map((b) => (
          <s-box key={b.title + b.body} border="base" borderRadius="base" padding="base">
            <s-stack gap="small-300">
              <s-heading>{b.title}</s-heading>
              <s-text>{b.body}</s-text>
            </s-stack>
          </s-box>
        ))}
      </s-stack>
    );
  }

  const canUpdate = shopify.instructions.value.discounts.canUpdateDiscountCodes;
  if (!canUpdate) return null;

  const applied = shopify.discountCodes.value.map((d) => d.code.toUpperCase());

  async function apply(code) {
    setError('');
    setBusyCode(code);
    const result = await shopify.applyDiscountCodeChange({type: 'addDiscountCode', code});
    setBusyCode(null);
    if (result.type === 'error') {
      setError("That code didn't work. Check the order total and try again.");
    }
  }

  return (
    <s-section heading={settings.coupons_title || "Available Coupons"}>
      <s-stack gap="small-200">
        {error && <s-banner tone="critical">{error}</s-banner>}
        {shown.map((b) => {
          const isApplied = applied.includes(b.code.toUpperCase());
          return (
            <s-box key={b.code} background="subdued" borderRadius="base" padding="small">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack gap="none">
                  <s-heading>{b.code}</s-heading>
                  <s-text color="subdued">{b.title}</s-text>
                </s-stack>
                {isApplied ? (
                  <s-badge tone="success">Applied</s-badge>
                ) : (
                  <s-button
                    variant="tertiary"
                    loading={busyCode === b.code}
                    onClick={() => apply(b.code)}
                  >
                    Apply
                  </s-button>
                )}
              </s-stack>
            </s-box>
          );
        })}
      </s-stack>
    </s-section>
  );
}
