// accessg component 3
export function accessgComponent3({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'accessg-3' },
    React.createElement('h3', null, 'fix: add role-based access guards 3'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
