export interface DynamicVariable {
    type: 'source' | 'date' | 'other'; // Add more types as needed
    value: string;
    display: string;
    action?: (setterFn: (value: string) => void) => void;
  }
  
  export function processDynamicVariables(text: string): {
    processedText: string;
    variables: DynamicVariable[];
  } {
    const regex = /@{(.*?)}/g;
    const variables: DynamicVariable[] = [];
    
    const processedText = text.replace(regex, (match, content) => {
      const varContent = content.trim().toLowerCase();
      
      // Handle different variable types
      if (varContent === 'today') {
        const today = new Date().toLocaleDateString();
        variables.push({
          type: 'date',
          value: today,
          display: varContent
        });
        return today;
      }
      
      // Assume it's a source if not a special keyword
      variables.push({
        type: 'source',
        value: varContent,
        display: varContent,
        action: (setSource) => setSource(varContent)
      });
      
      return match; // Keep the original @{} syntax in the text
    });
  
    return { processedText, variables };
  }