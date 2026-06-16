# Markdown Regression Fixture

This fixture is used by `npm run smoke` as a lightweight guard for Markdown,
math, table, and code-block behavior. It is not rendered during normal app use.

<!-- case:long-block-math -->

Long display math:

\[
f(x;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}\exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)
\cdot \prod_{i=1}^{n}\left(1+\frac{x_i^2}{\nu}\right)^{-\frac{\nu+1}{2}}
\]

<!-- case:latex-fenced-math -->

```latex
\frac{\partial}{\partial x}\left(\sum_{i=1}^{n} x_i^2\right)=2\sum_{i=1}^{n}x_i
```

<!-- case:wide-table -->

| ID | Name | Formula | Status | Owner | Region | Score | Updated | Notes | Action | Extra |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Alpha | $f(x)=x^2$ | Ready | Lin | CN | 98 | 2026-06-16 | Long cell text for horizontal scroll | Copy | A |
| 2 | Beta | $\sigma^2$ | Review | Ana | US | 87 | 2026-06-16 | Another long cell text for alignment | Open | B |

<!-- case:table-inline-math-code -->

| Item | Inline math | Inline code |
| --- | --- | --- |
| Mixed | $a_i+b_i=c_i$ | `const value = list[i]` |

<!-- case:plain-code -->

```ts
export function add(left: number, right: number) {
  return left + right;
}
```

<!-- case:unclosed-code-fence -->

```python
print("streaming fence is still open")

<!-- case:unclosed-math -->

This sentence intentionally leaves inline math open: $E = mc^2
