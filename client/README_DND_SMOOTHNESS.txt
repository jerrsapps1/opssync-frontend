Dashboard Smoothness Tips
-------------------------
Included:
- useSmoothDnD hook: add a brief transition class to soften layout jumps when a drag ends.
- dnd.css: cursor + 'will-change' + micro transitions; respects reduced motion.

How to use:
- Import the CSS once (e.g., in your root styles or App.tsx):  import "@/styles/dnd.css";
- Wrap your droppable container ref and call onDrop after your move completes:

  const { setEl, onDrop } = useSmoothDnD();

  <Droppable droppableId="employee-...">
    {(provided) => (
      <Card
        ref={(el) => { provided.innerRef(el); setEl(el as any); }}
        {...provided.droppableProps}
      >
        {/* ... */}
      </Card>
    )}
  </Droppable>

  // After you finish the assign mutation:
  onDrop();

This doesn't change react-beautiful-dnd's behavior—just adds a tiny visual smoothness to sibling items reflow.
