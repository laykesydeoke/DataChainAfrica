// datacons component 2
export function dataconsComponent2({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'datacons-2' },
    React.createElement('h3', null, 'fix: add data consistency checks 2'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
