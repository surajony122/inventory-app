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
  const [cfg, setCfg] = useState({title: '', max: 0});
  const [busyCode, setBusyCode] = useState(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    shopify
      .query(QUERY, {variables: {type: TYPE}})
      .then(({data, errors}) => {
        if (errors?.length) setLoadError(errors[0].message);
        const all = (data?.metaobjects?.nodes || []).map(parse);
        const conf = all.find((b) => b.kind === 'settings');
        if (conf) setCfg({title: conf.title, max: conf.sort});
        setBlocks(all.filter((b) => b.active && b.kind !== 'settings').sort((a, b) => a.sort - b.sort));
        setLoaded(true);
      })
      .catch((e) => {
        setLoadError(String(e?.message || e));
        setLoaded(true);
      });
  }, []);

  const coupons = blocks.filter((b) => b.kind === 'coupon');
  const notes = blocks.filter((b) => b.kind === 'note');
  const shownCoupons = cfg.max > 0 ? coupons.slice(0, cfg.max) : coupons;

  if (blocks.length === 0) {
    // Only the merchant sees this, inside the checkout editor.
    if (loaded && shopify.extension.editor) {
      return (
        <s-banner tone="warning" heading="Checkout Blocks">
          {loadError
            ? 'Could not load blocks: ' + loadError
            : 'No active coupons or notes were found. Add them in the team portal under Checkout Blocks.'}
        </s-banner>
      );
    }
    return null;
  }

  const canUpdate = shopify.instructions.value.discounts.canUpdateDiscountCodes;
  const applied = shopify.discountCodes.value.map((d) => d.code.toUpperCase());

  async function change(code, type) {
    setError('');
    setBusyCode(code);
    const result = await shopify.applyDiscountCodeChange({type, code});
    setBusyCode(null);
    if (result.type === 'error') {
      setError(
        type === 'addDiscountCode'
          ? "That code didn't work. Check the order total and try again."
          : "Couldn't remove that code. Please try again.",
      );
    }
  }

  return (
    <s-stack gap="base">
      {shownCoupons.length > 0 && (
        <s-box border="base" borderRadius="large" padding="base">
          <s-details open>
            <s-summary>
              <s-stack direction="inline" gap="small-200" alignItems="center">
                <s-icon type="discount" />
                <s-text type="strong">{cfg.title || 'Available Coupons'}</s-text>
              </s-stack>
            </s-summary>
            <s-stack gap="small-200">
              {error && <s-banner tone="critical">{error}</s-banner>}
              {shownCoupons.map((b) => {
                const isApplied = applied.includes(b.code.toUpperCase());
                if (isApplied) {
                  return (
                    <s-banner key={b.code} tone="success" heading={b.code + ' applied'}>
                      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                        <s-text>{b.title}</s-text>
                        <s-button
                          variant="secondary"
                          loading={busyCode === b.code}
                          disabled={!canUpdate}
                          onClick={() => change(b.code, 'removeDiscountCode')}
                        >
                          Remove
                        </s-button>
                      </s-stack>
                    </s-banner>
                  );
                }
                return (
                  <s-box key={b.code} background="subdued" border="base" borderRadius="base" padding="small">
                    <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                      <s-stack gap="none">
                        <s-heading>{b.code}</s-heading>
                        <s-text color="subdued">{b.title}</s-text>
                      </s-stack>
                      <s-button
                        variant="secondary"
                        loading={busyCode === b.code}
                        disabled={!canUpdate}
                        onClick={() => change(b.code, 'addDiscountCode')}
                      >
                        Apply
                      </s-button>
                    </s-stack>
                  </s-box>
                );
              })}
            </s-stack>
          </s-details>
        </s-box>
      )}
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
