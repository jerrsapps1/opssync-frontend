import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input, Box, List, ListItem, Text, Badge, Flex } from "@chakra-ui/react";
import { Search, MapPin, Wrench, Building, Clock } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

interface Equipment {
  id: string;
  name: string;
  type: string;
  make: string;
  model: string;
  status: string;
  currentProjectId: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface SearchResult {
  equipment: Equipment;
  project?: Project;
  location: string;
  locationIcon: any;
  statusColor: string;
}

export function AssetLocationSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch equipment data
  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Fetch projects data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Create project lookup
  const projectLookup = projects.reduce((acc, project) => {
    acc[project.id] = project;
    return acc;
  }, {} as Record<string, Project>);

  // Filter and create search results
  const searchResults = equipment
    .filter(eq => 
      searchTerm.length >= 2 && 
      (eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       eq.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
       eq.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
       eq.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
       eq.id.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .map(eq => {
      let location: string;
      let locationIcon: any;
      let statusColor: string;

      if (eq.status === "maintenance") {
        location = "Repair Shop";
        locationIcon = Wrench;
        statusColor = "orange";
      } else if (eq.currentProjectId) {
        const project = projectLookup[eq.currentProjectId];
        location = project ? project.name : "Assigned Project";
        locationIcon = Building;
        statusColor = "green";
      } else {
        location = "Available";
        locationIcon = Clock;
        statusColor = "blue";
      }

      return {
        equipment: eq,
        project: eq.currentProjectId ? projectLookup[eq.currentProjectId] : undefined,
        location,
        locationIcon,
        statusColor,
      };
    })
    .slice(0, 8); // Limit results

  const handleAssetClick = (result: SearchResult) => {
    setSelectedAsset(result);
    setIsDialogOpen(true);
    setShowResults(false);
    setSearchTerm("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(value.length >= 2);
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow clicks
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <Box position="relative" width="300px" data-testid="asset-location-search">
      <Box position="relative">
        <Search 
          size={16} 
          color="gray" 
          style={{ 
            position: "absolute", 
            left: "12px", 
            top: "50%", 
            transform: "translateY(-50%)",
            zIndex: 2
          }} 
        />
        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          bg="gray.700"
          border="1px solid"
          borderColor="gray.600"
          color="white"
          pl="40px"
          size="sm"
          _placeholder={{ color: "gray.400" }}
          _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4A90E2" }}
          data-testid="search-input"
        />
      </Box>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="gray.800"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          maxHeight="300px"
          overflowY="auto"
          mt={1}
          data-testid="search-results"
        >
          <List>
            {searchResults.map((result, index) => (
              <ListItem
                key={result.equipment.id}
                p={3}
                cursor="pointer"
                _hover={{ bg: "gray.700" }}
                borderBottom={index < searchResults.length - 1 ? "1px solid" : "none"}
                borderBottomColor="gray.700"
                onClick={() => handleAssetClick(result)}
                data-testid={`search-result-${result.equipment.id}`}
              >
                <Flex justify="space-between" align="center">
                  <Box flex={1}>
                    <Text color="white" fontWeight="medium" fontSize="sm">
                      {result.equipment.name}
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      {result.equipment.type} • {result.equipment.make}
                    </Text>
                  </Box>
                  <Flex align="center" gap={2}>
                    <result.locationIcon size={14} color="gray" />
                    <Badge size="sm" colorScheme={result.statusColor} fontSize="xs">
                      {result.location}
                    </Badge>
                  </Flex>
                </Flex>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {showResults && searchTerm.length >= 2 && searchResults.length === 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="gray.800"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          p={3}
          mt={1}
        >
          <Text color="gray.400" fontSize="sm" textAlign="center">
            No assets found matching "{searchTerm}"
          </Text>
        </Box>
      )}

      {/* Asset Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Asset Location Details"
      >
        {selectedAsset && (
          <Box color="white" data-testid="asset-details-dialog">
            <Flex align="center" gap={3} mb={4}>
              <selectedAsset.locationIcon size={20} color="#4A90E2" />
              <Text fontSize="lg" fontWeight="bold">
                {selectedAsset.equipment.name}
              </Text>
            </Flex>

            <Box space-y={3}>
              <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                <Text color="gray.400" fontSize="sm">Asset ID:</Text>
                <Text fontWeight="medium">{selectedAsset.equipment.id}</Text>
              </Flex>

              <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                <Text color="gray.400" fontSize="sm">Type:</Text>
                <Text fontWeight="medium">{selectedAsset.equipment.type}</Text>
              </Flex>

              <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                <Text color="gray.400" fontSize="sm">Make/Model:</Text>
                <Text fontWeight="medium">{selectedAsset.equipment.make} {selectedAsset.equipment.model}</Text>
              </Flex>

              <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                <Text color="gray.400" fontSize="sm">Current Location:</Text>
                <Flex align="center" gap={2}>
                  <selectedAsset.locationIcon size={16} />
                  <Badge colorScheme={selectedAsset.statusColor}>
                    {selectedAsset.location}
                  </Badge>
                </Flex>
              </Flex>

              {selectedAsset.project && (
                <>
                  <Flex justify="space-between" align="center" py={2} borderBottom="1px solid" borderBottomColor="gray.700">
                    <Text color="gray.400" fontSize="sm">Project Status:</Text>
                    <Badge colorScheme="blue" size="sm">
                      {selectedAsset.project.status}
                    </Badge>
                  </Flex>

                  <Flex justify="space-between" align="center" py={2}>
                    <Text color="gray.400" fontSize="sm">Project ID:</Text>
                    <Text fontWeight="medium" fontSize="sm" fontFamily="mono">
                      {selectedAsset.project.id}
                    </Text>
                  </Flex>
                </>
              )}

              {selectedAsset.equipment.status === "maintenance" && (
                <Box mt={4} p={3} bg="orange.900" borderRadius="md" border="1px solid" borderColor="orange.700">
                  <Flex align="center" gap={2} mb={1}>
                    <Wrench size={16} color="orange" />
                    <Text color="orange.200" fontWeight="medium" fontSize="sm">
                      In Repair Shop
                    </Text>
                  </Flex>
                  <Text color="orange.300" fontSize="xs">
                    This equipment is currently undergoing maintenance or repairs
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}