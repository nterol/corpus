/* 
    Goal of this version is to merge deeply D3 
    in React, inpired from this snippet:  
    https://stackoverflow.com/questions/30330646/how-to-create-a-d3-force-layout-graph-using-react
    in order to avoid overCalling of this.setstate()
*/

import React, { Component } from "react";
import ResizeObserver from "resize-observer-polyfill";

import FORCE from "../../engine/force";
import { LinkList } from "../elements/LinkList";
import { NodeList } from "../elements/NodeList";
import { CenterNode } from "../center-node/CenterNode";
import { graphParser } from "../utils/graphParser";

import graph from "../data/happy.json";

export const GraphContext = React.createContext();

export default class Ultimate extends Component {
  state = {
    addLinkArray: [],
    name: "",
    nodes: graph.nodes,
    links: graph.edges,
    relatedNodes: [],
    relatedLinks: [],
    nodeView: false,
    linkView: false,
    width: null,
    height: null
  };

  componentDidMount() {
    const ro = new ResizeObserver((entries, observer) => {
      for (const entry of entries) {
        const { height, width } = entry.contentRect;
        const { width: stateWidth, height: stateHeight } = this.state;
        if (stateWidth !== width || stateHeight !== height) {
          this.setState(
            prevState => {
              return { ...prevState, width, height };
            },
            () => {
              const { height, width, nodes, links } = this.state;
              FORCE.setHeight(height);
              FORCE.setWidth(width);
              FORCE.initForce(nodes, links);
              FORCE.tick(this);
              FORCE.drag();
            }
          );
        }
      }
    });
    ro.observe(this.gContainer);
  }

  componentDidUpdate(prevProps, { nodes: prevNodes, links: prevLinks }) {
    console.log("DID UPDATE");
    const { nodes, links, relatedNodes, relatedLinks } = this.state;
    if (!!relatedNodes.length && !!relatedLinks.length) {
      FORCE.initForce(relatedNodes, relatedLinks);
      FORCE.tick(this);
      FORCE.drag();
    }
    if (prevNodes !== nodes || prevLinks !== links) {
      FORCE.initForce(nodes, links);
      FORCE.tick(this);
      FORCE.drag();
    }
  }

  nodeSelector = async ({ target: { id } }) => {
    const [nodeId, type] = id.split("_");
    const { nodes, links } = this.state;

    const { filteredNodes, filteredLinks } = await this.getFilteredGraph(
      nodeId,
      links,
      nodes
    );
    console.log("NODE FIlter", filteredNodes, filteredLinks);
    this.setState(prevState => ({
      ...prevState,
      linkView: false,
      nodeView: { nodeId, type },
      relatedNodes: filteredNodes,
      relatedLinks: filteredLinks
    }));
  };

  getFilteredGraph = (id, links, nodes) => {
    return graphParser(id, links, nodes);
  };

  linkSelector = ({ target: { id } }) =>
    this.setState({ linkView: id, nodeView: false });

  render() {
    const { width, height, links, nodes, nodeView, linkView } = this.state;
    return (
      <GraphContext.Provider
        value={{
          nodeSelector: this.nodeSelector,
          linkSelector: this.linkSelector,
          linkView,
          nodeView
        }}
      >
        <div
          className="graph_container"
          ref={gContainer => (this.gContainer = gContainer)}
        >
          <svg
            className="graph"
            preserveAspectRatio="xMidYMid meet"
            width={width}
            height={height}
          >
            <LinkList links={links} />
            <NodeList nodes={nodes} nodeSelector={this.nodeView} />
          </svg>
          {nodeView || (linkView && <CenterNode />)}s
        </div>
      </GraphContext.Provider>
    );
  }
}
